from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import os
from typing import List, Dict, Any

# Simple JSON-based storage for Vercel
SUBMISSIONS_FILE = '/tmp/submissions.json'

def get_submissions() -> List[Dict[str, Any]]:
    if not os.path.exists(SUBMISSIONS_FILE):
        return []
    try:
        with open(SUBMISSIONS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def get_submissions_by_form_id(form_id: int) -> List[Dict[str, Any]]:
    submissions = get_submissions()
    return [sub for sub in submissions if sub['form_id'] == form_id]

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET /api/submissions?form_id={id}"""
        try:
            parsed_path = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_path.query)
            
            # Get form_id from query parameters
            if 'form_id' not in query_params:
                self._send_error(400, "form_id parameter is required")
                return
            
            try:
                form_id = int(query_params['form_id'][0])
            except (ValueError, IndexError):
                self._send_error(400, "Invalid form_id parameter")
                return
            
            # Get submissions for the form
            submissions = get_submissions_by_form_id(form_id)
            self._send_json_response(submissions)
            
        except Exception as e:
            self._send_error(500, f"Error fetching submissions: {str(e)}")
    
    def _send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _send_error(self, status, message):
        """Send error response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        error_data = {"error": message}
        self.wfile.write(json.dumps(error_data).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()