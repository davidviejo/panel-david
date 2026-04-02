from flask import Blueprint, request, jsonify, current_app, session, make_response
from apps.auth_utils import check_global_password, create_token, check_password_hash, verify_token
from apps.web.clients_store import find_client_by_slug
from apps.web.portal_bp import WEB_AUTH_COOKIE

auth_bp = Blueprint('auth_bp', __name__)


def _build_auth_response(token, role, scope=None):
    session_payload = {'role': role, 'scope': scope}
    session['auth_token'] = token
    session['auth_payload'] = session_payload

    response = make_response(jsonify({
        'authenticated': True,
        'role': role,
        'scope': scope,
        'session': {
            'strategy': 'httpOnlyCookie',
            'expiresInSeconds': 24 * 60 * 60,
        },
    }))
    response.set_cookie(
        WEB_AUTH_COOKIE,
        token,
        httponly=True,
        samesite='Lax',
        secure=bool(current_app.config.get('SESSION_COOKIE_SECURE', False)),
        max_age=24 * 60 * 60,
    )
    return response


def _auth_error(message, status, code):
    return jsonify({'code': code, 'error': message, 'message': message}), status


@auth_bp.route('/api/auth/clients-area', methods=['POST'])
def auth_clients_area():
    data = request.get_json() or {}
    password = data.get('password')

    if not password:
        return _auth_error('Password required', 400, 'AUTH_PASSWORD_REQUIRED')

    if check_global_password(password, 'CLIENTS_AREA_PASSWORD'):
        token = create_token(role='clients_area')
        return _build_auth_response(token, 'clients_area')

    return _auth_error('Invalid password', 401, 'AUTH_INVALID_CREDENTIALS')


@auth_bp.route('/api/auth/project/<slug>', methods=['POST'])
def auth_project(slug):
    data = request.get_json() or {}
    password = data.get('password')

    if not password:
        return _auth_error('Password required', 400, 'AUTH_PASSWORD_REQUIRED')

    # Master Password (Operator) Bypass
    if check_global_password(password, 'OPERATOR_PASSWORD'):
        token = create_token(role='operator')
        return _build_auth_response(token, 'operator')

    # Check project password
    project = find_client_by_slug(slug)

    if not project:
        return _auth_error('Project not found', 404, 'AUTH_PROJECT_NOT_FOUND')

    if check_password_hash(password, project.get('project_password_hash')):
        token = create_token(role='project', scope=slug)
        return _build_auth_response(token, 'project', scope=slug)

    return _auth_error('Invalid password', 401, 'AUTH_INVALID_CREDENTIALS')


@auth_bp.route('/api/auth/operator', methods=['POST'])
def auth_operator():
    data = request.get_json() or {}
    password = data.get('password')

    if not password:
        return _auth_error('Password required', 400, 'AUTH_PASSWORD_REQUIRED')

    if check_global_password(password, 'OPERATOR_PASSWORD'):
        token = create_token(role='operator')
        return _build_auth_response(token, 'operator')

    return _auth_error('Invalid password', 401, 'AUTH_INVALID_CREDENTIALS')


@auth_bp.route('/api/auth/session', methods=['GET'])
def auth_session_status():
    token = request.cookies.get(WEB_AUTH_COOKIE) or session.get('auth_token')
    payload = verify_token(token) if token else None

    if not payload:
        session.pop('auth_payload', None)
        session.pop('auth_token', None)
        return _auth_error('Session expired or invalid', 401, 'AUTH_SESSION_INVALID')

    session_payload = {
        'role': payload.get('role'),
        'scope': payload.get('scope'),
    }
    session['auth_payload'] = session_payload

    return jsonify({
        'authenticated': True,
        'role': session_payload['role'],
        'scope': session_payload['scope'],
    })


@auth_bp.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    session.clear()
    response = make_response(jsonify({'ok': True, 'message': 'Session closed'}))
    response.delete_cookie(WEB_AUTH_COOKIE)
    return response
