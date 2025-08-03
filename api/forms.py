from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

# Simple JSON-based storage for Vercel (can be replaced with proper DB later)
FORMS_FILE = '/tmp/forms.json'

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

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse URL to get form ID if provided
        parsed_path = urllib.parse.urlparse(self.path)
        path_parts = parsed_path.path.strip('/').split('/')
        
        # Handle GET /api/forms - get all forms
        if len(path_parts) == 2 and path_parts[0] == 'api' and path_parts[1] == 'forms':
            self._handle_get_all_forms()
        # Handle GET /api/forms/{id} - get specific form
        elif len(path_parts) == 3 and path_parts[0] == 'api' and path_parts[1] == 'forms':
            try:
                form_id = int(path_parts[2])
                self._handle_get_form(form_id)
            except ValueError:
                self._send_error(400, "Invalid form ID")
        else:
            self._send_error(404, "Not found")
    
    def do_POST(self):
        # Handle POST /api/forms - create new form
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/api/forms':
            self._handle_create_form()
        else:
            self._send_error(404, "Not found")
    
    def do_DELETE(self):
        # Handle DELETE /api/forms/{id} - delete form
        parsed_path = urllib.parse.urlparse(self.path)
        path_parts = parsed_path.path.strip('/').split('/')
        
        if len(path_parts) == 3 and path_parts[0] == 'api' and path_parts[1] == 'forms':
            try:
                form_id = int(path_parts[2])
                self._handle_delete_form(form_id)
            except ValueError:
                self._send_error(400, "Invalid form ID")
        else:
            self._send_error(404, "Not found")
    
    def _handle_get_all_forms(self):
        """Get all forms"""
        try:
            forms = get_forms()
            self._send_json_response(forms)
        except Exception as e:
            self._send_error(500, f"Error fetching forms: {str(e)}")
    
    def _handle_get_form(self, form_id: int):
        """Get specific form by ID"""
        try:
            form = get_form_by_id(form_id)
            if form:
                self._send_json_response(form)
            else:
                self._send_error(404, "Form not found")
        except Exception as e:
            self._send_error(500, f"Error fetching form: {str(e)}")
    
    def _handle_create_form(self):
        """Create new form"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Validate required fields
            if not data.get('name') or not data.get('goal'):
                self._send_error(400, "Name and goal are required")
                return
            
            form = create_form(
                name=data['name'],
                goal=data['goal'],
                ai_model=data.get('ai_model', 'gpt-4o-mini'),
                ai_tone=data.get('ai_tone', 'professional and friendly')
            )
            
            self._send_json_response(form, status=201)
        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON")
        except Exception as e:
            self._send_error(500, f"Error creating form: {str(e)}")
    
    def _handle_delete_form(self, form_id: int):
        """Delete form by ID"""
        try:
            success = delete_form(form_id)
            if success:
                self._send_json_response({"message": "Form deleted successfully"})
            else:
                self._send_error(404, "Form not found")
        except Exception as e:
            self._send_error(500, f"Error deleting form: {str(e)}")
    
    def _send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _send_error(self, status, message):
        """Send error response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        error_data = {"error": message}
        self.wfile.write(json.dumps(error_data).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()