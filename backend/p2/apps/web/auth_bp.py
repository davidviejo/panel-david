from flask import Blueprint, request, jsonify, current_app, session, make_response
from apps.auth_utils import check_global_password, create_token, check_password_hash
from apps.web.clients_store import find_client_by_slug
from apps.web.portal_bp import WEB_AUTH_COOKIE

auth_bp = Blueprint('auth_bp', __name__)


def _auth_error(message, status, code):
    return jsonify({'code': code, 'message': message, 'error': message}), status


def _cookie_secure():
    return bool(current_app.config.get('SESSION_COOKIE_SECURE', False))


def _cookie_samesite():
    return current_app.config.get('SESSION_COOKIE_SAMESITE', 'Lax')

def _build_auth_response(token, role, scope=None):
    payload = {'authenticated': True, 'role': role}
    if scope:
        payload['scope'] = scope

    session['auth_token'] = token
    session['auth_payload'] = {'role': role, 'scope': scope}

    response = make_response(jsonify(payload))
    response.set_cookie(
        WEB_AUTH_COOKIE,
        token,
        httponly=True,
        samesite=_cookie_samesite(),
        secure=_cookie_secure(),
        max_age=24 * 60 * 60,
        path='/',
    )
    return response


@auth_bp.route('/api/auth/clients-area', methods=['POST'])
def auth_clients_area():
    data = request.get_json(silent=True) or {}
    password = data.get('password')

    if not password:
        return _auth_error('Password required', 400, 'AUTH_BAD_REQUEST')

    if check_global_password(password, 'CLIENTS_AREA_PASSWORD'):
        token = create_token(role='clients_area')
        return _build_auth_response(token, 'clients_area')

    return _auth_error('Invalid password', 401, 'AUTH_INVALID_CREDENTIALS')

@auth_bp.route('/api/auth/project/<slug>', methods=['POST'])
def auth_project(slug):
    data = request.get_json(silent=True) or {}
    password = data.get('password')

    if not password:
        return _auth_error('Password required', 400, 'AUTH_BAD_REQUEST')

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
    data = request.get_json(silent=True) or {}
    password = data.get('password')

    if not password:
        return _auth_error('Password required', 400, 'AUTH_BAD_REQUEST')

    if check_global_password(password, 'OPERATOR_PASSWORD'):
        token = create_token(role='operator')
        return _build_auth_response(token, 'operator')

    return _auth_error('Invalid password', 401, 'AUTH_INVALID_CREDENTIALS')


@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('auth_token', None)
    session.pop('auth_payload', None)
    response = make_response('', 204)
    response.delete_cookie(
        WEB_AUTH_COOKIE,
        path='/',
        secure=_cookie_secure(),
        samesite=_cookie_samesite(),
    )
    return response


@auth_bp.route('/api/auth/session', methods=['GET'])
def auth_session():
    payload = session.get('auth_payload')
    if not payload:
        return _auth_error('Invalid or expired session', 401, 'AUTH_SESSION_EXPIRED')

    role = payload.get('role')
    if not role:
        return _auth_error('Invalid or expired session', 401, 'AUTH_SESSION_EXPIRED')

    response_payload = {'authenticated': True, 'role': role}
    scope = payload.get('scope')
    if scope:
        response_payload['scope'] = scope

    return jsonify(response_payload)
