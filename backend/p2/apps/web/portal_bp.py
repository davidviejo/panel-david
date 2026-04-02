from flask import Blueprint, request, jsonify, make_response, session, redirect, url_for
from apps.auth_utils import verify_token
from apps.web.clients_store import get_safe_clients
from functools import wraps

portal_bp = Blueprint('portal_bp', __name__)

WEB_AUTH_COOKIE = 'portal_auth_token'


def _extract_bearer_token_from_header():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ', 1)[1].strip()
    return None


def _extract_api_token():
    return request.cookies.get(WEB_AUTH_COOKIE) or _extract_bearer_token_from_header()


def _get_payload_from_token(token):
    if not token:
        return None
    return verify_token(token)


def _auth_error(message, status, code):
    return jsonify({'code': code, 'error': message, 'message': message}), status


def _get_web_payload():
    """
    Resolve auth payload for HTML views.
    Priority: Flask session payload -> JWT in session -> JWT in HttpOnly cookie -> Bearer header.
    """
    payload = session.get('auth_payload')
    if payload:
        return payload

    for token in (
        session.get('auth_token'),
        request.cookies.get(WEB_AUTH_COOKIE),
        _extract_bearer_token_from_header(),
    ):
        payload = _get_payload_from_token(token)
        if payload:
            session['auth_payload'] = payload
            return payload

    return None


def require_role(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = _extract_api_token()
            if not token:
                return _auth_error('Authentication required', 401, 'AUTH_REQUIRED')

            payload = _get_payload_from_token(token)

            if not payload:
                return _auth_error('Session expired or invalid', 401, 'AUTH_SESSION_INVALID')

            if payload.get('role') not in allowed_roles:
                return _auth_error('Insufficient permissions', 403, 'AUTH_FORBIDDEN')

            request.user_payload = payload
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_role_web(allowed_roles, login_endpoint='home'):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            payload = _get_web_payload()

            if not payload:
                return redirect(url_for(login_endpoint))

            if payload.get('role') not in allowed_roles:
                return redirect(url_for(login_endpoint))

            request.user_payload = payload
            return f(*args, **kwargs)

        return decorated_function

    return decorator


@portal_bp.route('/api/clients', methods=['GET'])
@require_role(['clients_area', 'operator'])
def list_clients():
    return jsonify(get_safe_clients())


@portal_bp.route('/api/public/clients', methods=['GET'])
def list_public_clients():
    response = make_response(jsonify(get_safe_clients()))
    response.headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300'
    return response


@portal_bp.route('/api/<slug>/overview', methods=['GET'])
@require_role(['project', 'clients_area', 'operator'])
def project_overview(slug):
    payload = request.user_payload
    if payload.get('role') == 'project' and payload.get('scope') != slug:
        return _auth_error('Access denied for this project', 403, 'AUTH_SCOPE_FORBIDDEN')

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
    return jsonify({
        "status": "accepted",
        "message": f"Tool {tool} execution queued (dummy)",
        "tool": tool
    })
