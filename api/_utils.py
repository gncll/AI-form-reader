import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

# Simple JSON-based storage for Vercel (can be replaced with proper DB later)
FORMS_FILE = '/tmp/forms.json'
SUBMISSIONS_FILE = '/tmp/submissions.json'

def get_forms() -> List[Dict[str, Any]]:
    """Get all forms from JSON storage"""
    if not os.path.exists(FORMS_FILE):
        return []
    
    try:
        with open(FORMS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_forms(forms: List[Dict[str, Any]]) -> None:
    """Save forms to JSON storage"""
    with open(FORMS_FILE, 'w') as f:
        json.dump(forms, f, indent=2)

def get_submissions() -> List[Dict[str, Any]]:
    """Get all submissions from JSON storage"""
    if not os.path.exists(SUBMISSIONS_FILE):
        return []
    
    try:
        with open(SUBMISSIONS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_submissions(submissions: List[Dict[str, Any]]) -> None:
    """Save submissions to JSON storage"""
    with open(SUBMISSIONS_FILE, 'w') as f:
        json.dump(submissions, f, indent=2)

def create_form(name: str, goal: str, ai_model: str = 'gpt-4o-mini', ai_tone: str = 'professional and friendly') -> Dict[str, Any]:
    """Create a new form"""
    forms = get_forms()
    
    new_form = {
        'id': len(forms) + 1,
        'name': name,
        'goal': goal,
        'ai_model': ai_model,
        'ai_tone': ai_tone,
        'created_at': datetime.now().isoformat()
    }
    
    forms.append(new_form)
    save_forms(forms)
    
    return new_form

def get_form_by_id(form_id: int) -> Optional[Dict[str, Any]]:
    """Get a form by ID"""
    forms = get_forms()
    for form in forms:
        if form['id'] == form_id:
            return form
    return None

def delete_form(form_id: int) -> bool:
    """Delete a form by ID"""
    forms = get_forms()
    original_length = len(forms)
    forms = [form for form in forms if form['id'] != form_id]
    
    if len(forms) < original_length:
        save_forms(forms)
        return True
    return False

def create_submission(form_id: int, summary: str) -> Dict[str, Any]:
    """Create a new submission"""
    submissions = get_submissions()
    
    new_submission = {
        'id': len(submissions) + 1,
        'form_id': form_id,
        'summary': summary,
        'created_at': datetime.now().isoformat()
    }
    
    submissions.append(new_submission)
    save_submissions(submissions)
    
    return new_submission

def get_submissions_by_form_id(form_id: int) -> List[Dict[str, Any]]:
    """Get all submissions for a form"""
    submissions = get_submissions()
    return [sub for sub in submissions if sub['form_id'] == form_id]