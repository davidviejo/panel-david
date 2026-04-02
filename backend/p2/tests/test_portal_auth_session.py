from apps.auth_utils import create_token


def test_cookie_auth_session_and_logout(client):
    login_response = client.post('/api/auth/clients-area', json={'password': '123456'})
    assert login_response.status_code == 200
    assert login_response.get_json()['authenticated'] is True
    assert login_response.get_json()['role'] == 'clients_area'

    set_cookie_header = login_response.headers.get('Set-Cookie', '')
    assert 'portal_auth_token=' in set_cookie_header
    assert 'HttpOnly' in set_cookie_header
    assert 'SameSite=' in set_cookie_header

    protected_response = client.get('/api/clients')
    assert protected_response.status_code == 200

    session_response = client.get('/api/auth/session')
    assert session_response.status_code == 200
    assert session_response.get_json()['authenticated'] is True

    logout_response = client.post('/api/auth/logout')
    assert logout_response.status_code == 204

    protected_after_logout = client.get('/api/clients')
    assert protected_after_logout.status_code == 401
    payload = protected_after_logout.get_json()
    assert payload['code'] == 'AUTH_SESSION_EXPIRED'


def test_permissions_scope_and_invalid_cookie(client, app):
    client.set_cookie('portal_auth_token', 'invalid-token')
    invalid_cookie_response = client.get('/api/clients')
    assert invalid_cookie_response.status_code == 401
    assert invalid_cookie_response.get_json()['code'] == 'AUTH_SESSION_EXPIRED'

    clients_login = client.post('/api/auth/clients-area', json={'password': '123456'})
    assert clients_login.status_code == 200

    operator_tool_forbidden = client.post('/api/tools/run/demo-tool')
    assert operator_tool_forbidden.status_code == 403
    assert operator_tool_forbidden.get_json()['code'] == 'AUTH_FORBIDDEN'

    with app.app_context():
        project_token = create_token(role='project', scope='zara')

    client.set_cookie('portal_auth_token', project_token)
    with client.session_transaction() as flask_session:
        flask_session['auth_token'] = project_token
        flask_session['auth_payload'] = {'role': 'project', 'scope': 'zara'}

    scope_mismatch = client.get('/api/acme/overview')
    assert scope_mismatch.status_code == 403
    assert scope_mismatch.get_json()['code'] == 'AUTH_SCOPE_MISMATCH'
