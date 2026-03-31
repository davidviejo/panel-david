import jwt


def _token(app, role, scope=None):
    payload = {'role': role, 'scope': scope}
    return jwt.encode(payload, app.config['JWT_SECRET'], algorithm='HS256')


def _auth_header(app, role, scope=None):
    return {'Authorization': f"Bearer {_token(app, role=role, scope=scope)}"}


def test_visibility_run_rejects_cross_project_access(client, app):
    payload = {
        'clientId': 'client-b',
        'brand': 'Marca',
        'competitors': [],
        'promptTemplate': 'template',
        'sources': ['news'],
        'providerPriority': ['gemini', 'openai'],
    }
    response = client.post(
        '/api/ai/visibility/run',
        json=payload,
        headers=_auth_header(app, role='project', scope='client-a'),
    )

    assert response.status_code == 403
    assert response.get_json()['error'] == 'Access denied for this client/project'


def test_visibility_history_allows_project_scope_match(client, app, monkeypatch):
    monkeypatch.setattr(
        'apps.web.blueprints.ai_routes.get_ai_visibility_history',
        lambda client_id: [
            {
                'id': 1,
                'client_id': client_id,
                'mentions': 10,
                'share_of_voice': 22,
                'sentiment': 0.8,
                'competitor_appearances': {'rival': 3},
                'raw_evidence': [],
                'provider_used': 'gemini',
                'created_at': '2026-03-31T00:00:00Z',
            }
        ],
    )

    response = client.get(
        '/api/ai/visibility/history/client-a',
        headers=_auth_header(app, role='project', scope='client-a'),
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['clientId'] == 'client-a'
    assert data['runs'][0]['providerUsed'] == 'gemini'


def test_visibility_run_uses_backend_key_resolution(client, app, monkeypatch):
    monkeypatch.setattr(
        'apps.web.blueprints.ai_routes.get_user_settings',
        lambda _user_id='default': {'google_key': 'secure-google-key'},
    )

    captured = {}

    def _fake_query_google(prompt, model, api_key):
        captured['api_key'] = api_key
        return '{"mentions": 1, "shareOfVoice": 5, "sentiment": 0.4, "competitorAppearances": {}, "rawEvidence": []}'

    monkeypatch.setattr('apps.tools.llm_service._query_google', _fake_query_google)
    monkeypatch.setattr('apps.tools.llm_service._query_openai', lambda *args, **kwargs: '{}')
    monkeypatch.setattr('apps.web.blueprints.ai_routes.insert_ai_visibility_run', lambda *args, **kwargs: {})

    response = client.post(
        '/api/ai/visibility/run',
        json={
            'clientId': 'client-a',
            'brand': 'Marca',
            'competitors': [],
            'promptTemplate': 'template',
            'sources': ['news'],
            'providerPriority': ['gemini'],
        },
        headers=_auth_header(app, role='project', scope='client-a'),
    )

    assert response.status_code == 200
    assert captured['api_key'] == 'secure-google-key'
