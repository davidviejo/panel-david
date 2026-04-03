from unittest.mock import patch


def test_run_visibility_returns_contract_error_and_trace_headers(client):
    response = client.post('/api/ai/visibility/run', json={})

    assert response.status_code == 400
    payload = response.get_json()
    assert payload['code'] == 'AI_VISIBILITY_INVALID_REQUEST'
    assert payload['error']
    assert payload['traceId']
    assert payload['requestId'] == payload['traceId']
    assert response.headers.get('x-trace-id') == payload['traceId']
    assert response.headers.get('x-request-id') == payload['traceId']


@patch('apps.web.blueprints.ai_routes.upsert_ai_visibility_schedule')
def test_resume_visibility_schedule_returns_active_status(mock_upsert, client):
    mock_upsert.return_value = {
        'frequency': 'daily',
        'timezone': 'UTC',
        'run_hour': 9,
        'run_minute': 0,
        'status': 'active',
        'last_run_at': None,
        'updated_at': '2026-04-03T00:00:00Z',
    }

    response = client.post('/api/ai/visibility/schedule/123/resume')

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['clientId'] == '123'
    assert payload['schedule']['status'] == 'active'
    assert response.headers.get('x-trace-id')
    assert response.headers.get('x-request-id')
