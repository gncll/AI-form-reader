

import os
import openai
import smtplib
import sqlite3
from email.mime.text import MIMEText
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from database import get_db_connection, init_db

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# --- CORS Configuration ---
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- OpenAI Configuration ---
openai.api_key = os.getenv("OPENAI_API_KEY")

# --- Pydantic Models ---
class Conversation(BaseModel):
    history: list[dict[str, str]]
    form_id: int # Now linked to a specific form

class FormBase(BaseModel):
    name: str
    goal: str
    ai_model: Optional[str] = "gpt-4o-mini"
    ai_tone: Optional[str] = "professional and friendly"

class FormCreate(FormBase):
    pass

class FormResponse(FormBase):
    id: int
    created_at: str

    class Config:
        orm_mode = True

class SubmissionResponse(BaseModel):
    id: int
    form_id: int
    summary: str
    created_at: str

    class Config:
        orm_mode = True

# --- Helper Functions ---
def send_email(subject: str, body: str):
    sender = os.getenv("EMAIL_SENDER")
    receiver = os.getenv("EMAIL_RECEIVER")
    password = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 587))

    if not all([sender, receiver, password, smtp_server]):
        print("Email configuration is incomplete. Skipping email.")
        return

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = receiver

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender, password)
            server.send_message(msg)
            print("Email sent successfully!")
    except Exception as e:
        print(f"Failed to send email: {e}")

# --- API Endpoints ---

@app.on_event("startup")
async def startup_event():
    init_db()

@app.post("/forms", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
async def create_form(form: FormCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO forms (name, goal, ai_model, ai_tone) VALUES (?, ?, ?, ?)",
            (form.name, form.goal, form.ai_model, form.ai_tone)
        )
        conn.commit()
        form_id = cursor.lastrowid
        new_form = conn.execute("SELECT * FROM forms WHERE id = ?", (form_id,)).fetchone()
        return FormResponse(**new_form)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        conn.close()

@app.get("/forms", response_model=List[FormResponse])
async def get_forms():
    conn = get_db_connection()
    forms = conn.execute("SELECT * FROM forms").fetchall()
    conn.close()
    return [FormResponse(**form) for form in forms]

@app.get("/forms/{form_id}", response_model=FormResponse)
async def get_form(form_id: int):
    conn = get_db_connection()
    form = conn.execute("SELECT * FROM forms WHERE id = ?", (form_id,)).fetchone()
    conn.close()
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return FormResponse(**form)

@app.put("/forms/{form_id}", response_model=FormResponse)
async def update_form(form_id: int, form: FormCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE forms SET name = ?, goal = ?, ai_model = ?, ai_tone = ? WHERE id = ?",
            (form.name, form.goal, form.ai_model, form.ai_tone, form_id)
        )
        conn.commit()
        updated_form = conn.execute("SELECT * FROM forms WHERE id = ?", (form_id,)).fetchone()
        if updated_form is None:
            raise HTTPException(status_code=404, detail="Form not found")
        return FormResponse(**updated_form)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        conn.close()

@app.delete("/forms/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(form_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM forms WHERE id = ?", (form_id,))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Form not found")
    conn.close()
    return

@app.get("/forms/{form_id}/submissions", response_model=List[SubmissionResponse])
async def get_form_submissions(form_id: int):
    conn = get_db_connection()
    submissions = conn.execute("SELECT * FROM submissions WHERE form_id = ?", (form_id,)).fetchall()
    conn.close()
    return [SubmissionResponse(**s) for s in submissions]

@app.post("/generate_question", response_model=dict)
async def generate_question(conversation: Conversation):
    conn = get_db_connection()
    form = conn.execute("SELECT * FROM forms WHERE id = ?", (conversation.form_id,)).fetchone()
    conn.close()

    if form is None:
        raise HTTPException(status_code=404, detail="Form not found.")

    if not openai.api_key or "YOUR_OPENAI_API_KEY" in openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key is not configured.")

    system_prompt = f"""You are a flawless AI assistant. Your goal is to: {form['goal']}.
    Your instructions are strict:
    1. Ask only one, very short, and clear question at a time.
    2. Your English must be absolutely perfect. Double-check for any typos or grammatical errors before responding.
    3. Analyze previous answers to ask relevant follow-up questions.
    4. When the goal is met, you MUST end the conversation by saying 'CONVERSATION_END'.
    Your tone should be: {form['ai_tone']}."""

    messages = [{"role": "system", "content": system_prompt}] + conversation.history

    try:
        response = openai.chat.completions.create(
            model=form['ai_model'],
            messages=messages,
            max_tokens=60,
            temperature=0.4
        )
        raw_response = response.choices[0].message.content
        print(f"--- OpenAI Raw Response: '{raw_response}' ---")
        next_question = raw_response.strip()

        if "CONVERSATION_END" in next_question:
            summary = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation.history])
            
            # Save submission to database
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO submissions (form_id, summary) VALUES (?, ?)",
                (conversation.form_id, summary)
            )
            conn.commit()
            conn.close()

            send_email(f"Conversation Summary for Form ID {conversation.form_id}: {form['name']}", summary)
            return {"next_question": "Thank you for your time! The conversation is now complete."}

        return {"next_question": next_question}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Backend is running with AI, email, and database capabilities."}
