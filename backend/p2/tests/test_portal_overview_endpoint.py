from unittest.mock import patch

from apps.web import create_app


def _auth_header(token='test-token'):
    return {'Authorization': f'Bearer {token}'}


def test_project_overview_returns_200_for_authorized_scope():
    app = create_app()
    app.config['TESTING'] = True

    with app.test_client() as client:
        with patch('apps.web.portal_bp.verify_token', return_value={'role': 'project', 'scope': 'diego-casas'}):
            response = client.get('/api/diego-casas/overview', headers=_auth_header())

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['project']['slug'] == 'diego-casas'
    assert payload['contract']['version'] == '1.0'
    assert 'metrics' in payload


def test_project_overview_returns_401_without_auth_header():
    app = create_app()
    app.config['TESTING'] = True

    with app.test_client() as client:
        response = client.get('/api/diego-casas/overview')

    assert response.status_code == 401
    payload = response.get_json()
    assert payload['error'] == 'Missing or invalid Authorization header'
    assert payload['traceId']


def test_project_overview_returns_403_for_scope_mismatch():
    app = create_app()
    app.config['TESTING'] = True

    with app.test_client() as client:
        with patch('apps.web.portal_bp.verify_token', return_value={'role': 'project', 'scope': 'other-project'}):
            response = client.get('/api/diego-casas/overview', headers=_auth_header())

    assert response.status_code == 403
    payload = response.get_json()
    assert payload['error'] == 'Access denied for this project'


def test_project_overview_returns_404_when_slug_does_not_exist():
    app = create_app()
    app.config['TESTING'] = True

    with app.test_client() as client:
        with patch('apps.web.portal_bp.verify_token', return_value={'role': 'operator'}):
            response = client.get('/api/not-found/overview', headers=_auth_header())

    assert response.status_code == 404
    payload = response.get_json()
    assert payload['error'] == 'Project not found'
