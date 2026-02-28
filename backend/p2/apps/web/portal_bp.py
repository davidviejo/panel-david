from flask import Blueprint, request, jsonify, current_app
from apps.auth_utils import verify_token
import json
import os
from functools import wraps

portal_bp = Blueprint('portal_bp', __name__)

def get_clients_db():
    try:
        # Use absolute path to ensure the file is found regardless of CWD
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(base_dir, '..', 'data', 'clients_db.json')
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def require_role(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Missing or invalid Authorization header'}), 401

            token = auth_header.split(' ')[1]
            payload = verify_token(token)

            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401

            if payload.get('role') not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403

            # For project role, verify scope if applicable
            if payload.get('role') == 'project':
                # Assuming the route has a <slug> parameter, or we check against something else
                # In this simple implementation, we might just pass the payload to the function
                # or attach it to request.
                pass

            request.user_payload = payload
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@portal_bp.route('/api/clients', methods=['GET'])
@require_role(['clients_area', 'operator'])
def list_clients():
    clients = get_clients_db()
    # Filter sensitive data like password hash
    safe_clients = []
    for c in clients:
        safe_clients.append({
            'slug': c.get('slug'),
            'name': c.get('name'),
            'status': c.get('status'),
            'description': c.get('description')
        })
    return jsonify(safe_clients)

@portal_bp.route('/api/public/clients', methods=['GET'])
def list_public_clients():
    clients = get_clients_db()
    # Filter sensitive data like password hash
    safe_clients = []
    for c in clients:
        # Only show active clients if needed, but requirements just said "as they are created"
        safe_clients.append({
            'slug': c.get('slug'),
            'name': c.get('name'),
            'status': c.get('status'),
            'description': c.get('description')
        })
    return jsonify(safe_clients)

@portal_bp.route('/api/<slug>/overview', methods=['GET'])
@require_role(['project', 'clients_area', 'operator'])
def project_overview(slug):
    # If role is project, ensure scope matches slug
    payload = request.user_payload
    if payload.get('role') == 'project' and payload.get('scope') != slug:
        return jsonify({'error': 'Access denied for this project'}), 403

    # Return mock data
    return jsonify({
        "project": slug,
        "traffic": "12.5K",
        "keywords_top3": 45,
        "health_score": 92,
        "recent_issues": [
            "Missing H1 on 3 pages",
            "Slow LCP on homepage"
        ]
    })

@portal_bp.route('/api/tools/run/<tool>', methods=['POST'])
@require_role(['operator'])
def run_tool(tool):
    # Dummy endpoint
    return jsonify({
        "status": "accepted",
        "message": f"Tool {tool} execution queued (dummy)",
        "tool": tool
    })
