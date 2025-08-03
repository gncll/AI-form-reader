from http.server import BaseHTTPRequestHandler
import json
import os
import requests
from _utils import get_form_by_id, create_submission

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST /api/generate_question"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Validate required fields
            if 'form_id' not in data or 'history' not in data:
                self._send_error(400, "form_id and history are required")
                return
            
            form_id = data['form_id']
            history = data['history']
            
            # Get form details
            form = get_form_by_id(form_id)
            if not form:
                self._send_error(404, "Form not found")
                return
            
            # Generate next question using OpenAI
            next_question = self._generate_question_with_openai(form, history)
            
            # If conversation is complete, save submission
            if "Thank you for your time" in next_question:
                # Extract user responses for summary
                user_responses = [msg['content'] for msg in history if msg['role'] == 'user']
                summary = " | ".join(user_responses)
                create_submission(form_id, summary)
            
            self._send_json_response({"next_question": next_question})
            
        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON")
        except Exception as e:
            self._send_error(500, f"Error generating question: {str(e)}")
    
    def _generate_question_with_openai(self, form, history):
        """Generate next question using OpenAI API"""
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise Exception("OpenAI API key not configured")
        
        # Build conversation context
        messages = [
            {
                "role": "system", 
                "content": f"""You are a helpful assistant conducting a form interview. 
                
Form Goal: {form['goal']}
Tone: {form['ai_tone']}

Rules:
1. Ask ONE question at a time
2. Keep questions conversational and engaging
3. After 3-5 meaningful questions, conclude with "Thank you for your time! Your responses have been recorded."
4. Don't repeat questions
5. Build upon previous answers"""
            }
        ]
        
        # Add conversation history
        messages.extend(history)
        
        # Add a prompt for the next question
        messages.append({
            "role": "user",
            "content": "What's the next question? (If we have enough information, please conclude the interview)"
        })
        
        try:
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': form['ai_model'],
                    'messages': messages,
                    'max_tokens': 150,
                    'temperature': 0.7
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
            else:
                raise Exception(f"OpenAI API error: {response.status_code}")
                
        except requests.exceptions.Timeout:
            raise Exception("OpenAI API timeout")
        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenAI API request failed: {str(e)}")
    
    def _send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _send_error(self, status, message):
        """Send error response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        error_data = {"detail": message}
        self.wfile.write(json.dumps(error_data).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()