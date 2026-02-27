from flask import Blueprint, request, jsonify, current_app
from apps.auth_utils import check_global_password, create_token, check_password_hash
import json
import os

auth_bp = Blueprint('auth_bp', __name__)

def get_clients_db():
    try:
        with open('clients_db.json', 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

@auth_bp.route('/api/auth/clients-area', methods=['POST'])
def auth_clients_area():
    data = request.get_json()
    password = data.get('password')

    if not password:
        return jsonify({'error': 'Password required'}), 400

    if check_global_password(password, 'CLIENTS_AREA_PASSWORD'):
        token = create_token(role='clients_area')
        return jsonify({'token': token, 'role': 'clients_area'})

    return jsonify({'error': 'Invalid password'}), 401

@auth_bp.route('/api/auth/project/<slug>', methods=['POST'])
def auth_project(slug):
    data = request.get_json()
    password = data.get('password')

    if not password:
        return jsonify({'error': 'Password required'}), 400

    # Check project password
    clients = get_clients_db()
    project = next((c for c in clients if c.get('slug') == slug), None)

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    # User asked for bcrypt for project passwords too
    if check_password_hash(password, project.get('project_password_hash')):
        token = create_token(role='project', scope=slug)
        return jsonify({'token': token, 'role': 'project', 'scope': slug})

    return jsonify({'error': 'Invalid password'}), 401

@auth_bp.route('/api/auth/operator', methods=['POST'])
def auth_operator():
    data = request.get_json()
    password = data.get('password')

    if not password:
        return jsonify({'error': 'Password required'}), 400

    if check_global_password(password, 'OPERATOR_PASSWORD'):
        token = create_token(role='operator')
        return jsonify({'token': token, 'role': 'operator'})

    return jsonify({'error': 'Invalid password'}), 401
