from apps.web import create_app


def _build_test_app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['CLIENTS_AREA_PASSWORD'] = 'secret_clients_pass'
    app.config['OPERATOR_PASSWORD'] = 'secret_operator_pass'
    app.config['JWT_SECRET'] = 'test_secret'
    return app


def test_auth_session_and_logout_cookie_flow():
    app = _build_test_app()

    with app.test_client() as client:
        login_response = client.post('/api/auth/clients-area', json={'password': 'secret_clients_pass'})
        assert login_response.status_code == 200
        assert login_response.get_json()['role'] == 'clients_area'

        session_response = client.get('/api/auth/session')
        assert session_response.status_code == 200
        session_payload = session_response.get_json()
        assert session_payload['authenticated'] is True
        assert session_payload['role'] == 'clients_area'

        clients_response = client.get('/api/clients')
        assert clients_response.status_code == 200

        logout_response = client.post('/api/auth/logout')
        assert logout_response.status_code == 200

        post_logout_session = client.get('/api/auth/session')
        assert post_logout_session.status_code == 401
        assert post_logout_session.get_json()['authenticated'] is False

        post_logout_clients = client.get('/api/clients')
        assert post_logout_clients.status_code == 401


def test_auth_session_rejects_invalid_cookie_token():
    app = _build_test_app()

    with app.test_client() as client:
        client.set_cookie('portal_auth_token', 'invalid-token')
        response = client.get('/api/auth/session')

    assert response.status_code == 401
    payload = response.get_json()
    assert payload['authenticated'] is False
