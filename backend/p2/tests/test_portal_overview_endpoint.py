from unittest.mock import patch


def _auth_header() -> dict:
    return {'Authorization': 'Bearer test-token'}


def test_project_overview_200(client):
    payload = {
        'contract_version': '2026-04-portal-overview-v1',
        'generated_at': '2026-04-02T00:00:00+00:00',
        'project': {'slug': 'demo-project', 'name': 'Demo Project', 'status': 'active'},
        'metrics': {
            'organic_traffic_estimate': {'value': 13000, 'formatted': '13.0K', 'unit': 'monthly_visits'},
            'keywords_top3': {'value': 5},
            'health_score': {'value': 83, 'scale_max': 100},
            'recent_issues': [],
            'source': 'crawler_report',
            'is_empty': False,
        },
    }

    with patch('apps.web.portal_bp.verify_token', return_value={'role': 'clients_area'}), patch(
        'apps.web.portal_bp.build_project_overview_contract', return_value=payload
    ):
        response = client.get('/api/demo-project/overview', headers=_auth_header())

    assert response.status_code == 200
    assert response.json['contract_version'] == '2026-04-portal-overview-v1'
    assert response.json['metrics']['health_score']['value'] == 83


def test_project_overview_401_missing_auth(client):
    response = client.get('/api/demo-project/overview')
    assert response.status_code == 401
    assert response.json['code'] == 'AUTH_HEADER_MISSING'
    assert response.json['traceId']


def test_project_overview_403_scope_mismatch(client):
    with patch('apps.web.portal_bp.verify_token', return_value={'role': 'project', 'scope': 'other-project'}):
        response = client.get('/api/demo-project/overview', headers=_auth_header())

    assert response.status_code == 403
    assert response.json['code'] == 'PROJECT_SCOPE_FORBIDDEN'


def test_project_overview_404_not_found(client):
    from apps.services.project_overview import ProjectOverviewNotFoundError

    with patch('apps.web.portal_bp.verify_token', return_value={'role': 'operator'}), patch(
        'apps.web.portal_bp.build_project_overview_contract', side_effect=ProjectOverviewNotFoundError('missing')
    ):
        response = client.get('/api/missing/overview', headers=_auth_header())

    assert response.status_code == 404
    assert response.json['code'] == 'PROJECT_NOT_FOUND'
