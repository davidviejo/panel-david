import json
import logging
import uuid

from flask import Blueprint, request, jsonify, make_response, session, redirect, url_for
from apps.auth_utils import verify_token
from apps.web.clients_store import get_safe_clients
from functools import wraps

from apps.services.project_overview import ProjectOverviewNotFoundError, build_project_overview_contract

portal_bp = Blueprint('portal_bp', __name__)
logger = logging.getLogger(__name__)

WEB_AUTH_COOKIE = 'portal_auth_token'


def _resolve_traceability():
    trace_id = request.headers.get('X-Trace-Id') or request.headers.get('Trace-Id')
    request_id = request.headers.get('X-Request-Id') or request.headers.get('Request-Id') or str(uuid.uuid4())
    return {
        'traceId': trace_id or request_id,
        'requestId': request_id,
    }


def _error_response(status: int, code: str, message: str):
    traceability = _resolve_traceability()
    payload = {
        'code': code,
        'error': message,
        **traceability,
    }
    response = jsonify(payload)
    response.status_code = status
    response.headers['X-Trace-Id'] = traceability['traceId']
    response.headers['X-Request-Id'] = traceability['requestId']
    return response


def _extract_bearer_token_from_header():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ', 1)[1].strip()
    return None


def _get_payload_from_token(token):
    if not token:
        return None
    return verify_token(token)


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
            token = _extract_bearer_token_from_header()
            if not token:
                return _error_response(401, 'AUTH_HEADER_MISSING', 'Missing or invalid Authorization header')

            payload = _get_payload_from_token(token)

            if not payload:
                return _error_response(401, 'AUTH_TOKEN_INVALID', 'Invalid or expired token')

            if payload.get('role') not in allowed_roles:
                return _error_response(403, 'AUTH_FORBIDDEN', 'Insufficient permissions')

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
        return _error_response(403, 'PROJECT_SCOPE_FORBIDDEN', 'Access denied for this project')

    try:
        response_payload = build_project_overview_contract(slug)
        response = jsonify(response_payload)
        traceability = _resolve_traceability()
        response.headers['X-Trace-Id'] = traceability['traceId']
        response.headers['X-Request-Id'] = traceability['requestId']
        return response
    except ProjectOverviewNotFoundError:
        return _error_response(404, 'PROJECT_NOT_FOUND', 'Project not found')
    except Exception as exc:
        traceability = _resolve_traceability()
        logger.error(json.dumps({
            'event': 'portal_overview_failed',
            'status': 500,
            'endpoint': request.path,
            'traceId': traceability['traceId'],
            'requestId': traceability['requestId'],
            'error': str(exc),
        }))
        return _error_response(500, 'PROJECT_OVERVIEW_FETCH_FAILED', 'Unable to load project overview')

@portal_bp.route('/api/tools/run/<tool>', methods=['POST'])
@require_role(['operator'])
def run_tool(tool):
    # Dummy endpoint
    return jsonify({
        "status": "accepted",
        "message": f"Tool {tool} execution queued (dummy)",
        "tool": tool
    })
