import json
from flask import Blueprint, jsonify, request
from apps.auth import token_required

portal_bp = Blueprint('portal_bp', __name__)

def load_projects_db():
    try:
        with open('backend/p2/projects_db.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        try:
             with open('projects_db.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return []

@portal_bp.route('/api/clients', methods=['GET'])
@token_required(allowed_roles=['clients_area'])
def get_clients():
    projects = load_projects_db()
    # Return minimal info for list
    clients_list = []
    for p in projects:
        clients_list.append({
            "id": p.get("id"),
            "name": p.get("name"),
            "domain": p.get("domain"),
            "status": "active" # Mock status
        })
    return jsonify(clients_list)

@portal_bp.route('/api/<slug>/overview', methods=['GET'])
@token_required(allowed_roles=['project'])
def get_project_overview(slug):
    # Verify scope matches slug (or user is operator)
    user_data = request.user_data
    if user_data['role'] != 'operator':
        if user_data.get('scope') != slug:
            return jsonify({'message': 'Access denied to this project'}), 403

    projects = load_projects_db()
    project = next((p for p in projects if p['id'] == slug), None)

    if not project:
         return jsonify({'message': 'Project not found'}), 404

    # Mock overview data
    overview_data = {
        "project": project,
        "stats": {
            "organic_traffic": 12500,
            "keywords_top_3": 45,
            "keywords_top_10": 120,
            "health_score": 92
        },
        "recent_activities": [
            {"date": "2023-10-25", "action": "Audit completed"},
            {"date": "2023-10-24", "action": "New keywords detected"}
        ]
    }

    return jsonify(overview_data)

@portal_bp.route('/api/tools/run/<tool>', methods=['POST'])
@token_required(allowed_roles=['operator'])
def run_tool(tool):
    return jsonify({"status": "accepted", "message": f"Tool {tool} execution queued."})
