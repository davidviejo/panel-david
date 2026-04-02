import os
from apps.auth_utils import create_token

os.environ.setdefault('CLIENTS_AREA_PASSWORD', '123456')
os.environ.setdefault('OPERATOR_PASSWORD', '123456')
os.environ.setdefault('JWT_SECRET', 'test-secret')


def _extract_cookie_value(set_cookie_header: str, key: str) -> str | None:
    for chunk in set_cookie_header.split(';'):
      part = chunk.strip()
      if part.startswith(f'{key}='):
          return part.split('=', 1)[1]
    return None


def test_clients_login_session_cookie_and_protected_access(client):
    login = client.post('/api/auth/clients-area', json={'password': '123456'})
    assert login.status_code == 200
    body = login.get_json()
    assert body['authenticated'] is True
    assert body['role'] == 'clients_area'

    set_cookie = login.headers.get('Set-Cookie', '')
    token_cookie = _extract_cookie_value(set_cookie, 'portal_auth_token')
    assert token_cookie

    protected = client.get('/api/clients')
    assert protected.status_code == 200


def test_session_endpoint_and_logout_invalidate_cookie_session(client):
    client.post('/api/auth/operator', json={'password': '123456'})

    session_ok = client.get('/api/auth/session')
    assert session_ok.status_code == 200
    assert session_ok.get_json()['role'] == 'operator'

    logout = client.post('/api/auth/logout')
    assert logout.status_code == 200

    session_after_logout = client.get('/api/auth/session')
    assert session_after_logout.status_code == 401
    payload = session_after_logout.get_json()
    assert payload['code'] == 'AUTH_SESSION_INVALID'


def test_scope_enforced_for_project_role(client, app):
    with app.app_context():
        token = create_token(role='project', scope='test-client')
    client.set_cookie('portal_auth_token', token)

    allowed = client.get('/api/test-client/overview')
    assert allowed.status_code == 200

    forbidden = client.get('/api/other-client/overview')
    assert forbidden.status_code == 403
    forbidden_payload = forbidden.get_json()
    assert forbidden_payload['code'] == 'AUTH_SCOPE_FORBIDDEN'
