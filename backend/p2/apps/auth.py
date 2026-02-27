import os
import json
import datetime
import jwt
import bcrypt
from functools import wraps
from flask import Blueprint, request, jsonify, current_app

auth_bp = Blueprint('auth_bp', __name__)

def load_auth_db():
    try:
        with open('backend/p2/auth_db.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback if running from a different working directory
        try:
            with open('auth_db.json', 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {"project_hashes": {}}

def check_password(password, hashed_password):
    if not hashed_password:
        return False
    # If the hash in config/db is a string, encode it to bytes
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    if isinstance(password, str):
        password = password.encode('utf-8')

    try:
        return bcrypt.checkpw(password, hashed_password)
    except ValueError:
        return False

def create_token(role, scope=None, expires_in=24):
    payload = {
        'role': role,
        'scope': scope,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=expires_in)
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET'], algorithm='HS256')

# Decorator to verify JWT
def token_required(allowed_roles=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                if auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]

            if not token:
                return jsonify({'message': 'Token is missing'}), 401

            try:
                data = jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=["HS256"])
                current_role = data.get('role')
                # current_scope = data.get('scope') # Not used yet

                # Verify role
                if allowed_roles:
                    # 'operator' role implies access to everything (superuser-like for this scope)
                    if current_role != 'operator' and current_role not in allowed_roles:
                         return jsonify({'message': 'Permission denied'}), 403

                # Attach user info to request
                request.user_data = data

            except jwt.ExpiredSignatureError:
                return jsonify({'message': 'Token is expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'message': 'Token is invalid'}), 401

            return f(*args, **kwargs)
        return decorated_function
    return decorator

@auth_bp.route('/api/auth/clients-area', methods=['POST'])
def login_clients_area():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Missing JSON body'}), 400

    password = data.get('password')

    # In production, these hashes should be in environment variables
    stored_hash = current_app.config.get('CLIENTS_AREA_PASSWORD_HASH')

    if check_password(password, stored_hash):
        token = create_token('clients_area')
        return jsonify({'token': token, 'role': 'clients_area'})

    return jsonify({'message': 'Invalid credentials'}), 401

@auth_bp.route('/api/auth/operator', methods=['POST'])
def login_operator():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Missing JSON body'}), 400

    password = data.get('password')
    stored_hash = current_app.config.get('OPERATOR_PASSWORD_HASH')

    if check_password(password, stored_hash):
        token = create_token('operator')
        return jsonify({'token': token, 'role': 'operator'})

    return jsonify({'message': 'Invalid credentials'}), 401

@auth_bp.route('/api/auth/project/<slug>', methods=['POST'])
# This endpoint requires being logged in as client_area OR operator first?
# Wait, the requirement says: "POST /api/auth/project/<slug> {password} -> devuelve JWT role=project, scope=slug (requiere clients_area)"
# So yes, you must be logged in as clients_area first to attempt project login.
@token_required(allowed_roles=['clients_area', 'operator'])
def login_project(slug):
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Missing JSON body'}), 400

    password = data.get('password')

    db = load_auth_db()

    # We look up by slug (ID) in auth_db
    project_hashes = db.get('project_hashes', {})
    project_hash = project_hashes.get(slug)

    if not project_hash:
        return jsonify({'message': 'Project not found or no password set'}), 404

    if check_password(password, project_hash):
        token = create_token('project', scope=slug)
        return jsonify({'token': token, 'role': 'project', 'scope': slug})

    return jsonify({'message': 'Invalid project password'}), 401
