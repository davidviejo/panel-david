from unittest.mock import patch

from apps.web import create_app


def test_trends_media_news_returns_articles_from_backend_provider():
    app = create_app()
    app.config['TESTING'] = True

    payload = {
        'news_results': [
            {
                'title': 'Titular principal',
                'link': 'https://example.com/main',
                'source': {'name': 'Example'},
                'date': '2026-04-02T09:00:00Z',
                'thumbnail': 'https://example.com/thumb.jpg',
                'snippet': 'Resumen principal',
            }
        ]
    }

    with app.test_client() as client:
        with patch('apps.web.blueprints.trends_economy._resolve_serpapi_key', return_value='test-key'):
            with patch('apps.web.blueprints.trends_economy.requests.get') as mock_get:
                mock_get.return_value.ok = True
                mock_get.return_value.json.return_value = payload

                response = client.post(
                    '/trends/media/news',
                    json={'queries': ['valencia economia'], 'provider': 'serpapi'},
                )

    assert response.status_code == 200
    data = response.get_json()
    assert data['providerUsed'] == 'serpapi'
    assert len(data['articles']) == 1
    assert data['articles'][0]['title'] == 'Titular principal'
    assert response.headers.get('x-trace-id')
    assert response.headers.get('x-request-id')


def test_trends_media_news_returns_traceable_error_when_key_missing():
    app = create_app()
    app.config['TESTING'] = True

    with app.test_client() as client:
        with patch('apps.web.blueprints.trends_economy._resolve_serpapi_key', return_value=''):
            response = client.post('/trends/media/news', json={'queries': ['valencia economia']})

    assert response.status_code == 400
    data = response.get_json()
    assert data['code'] == 'TRENDS_NEWS_SERPAPI_KEY_MISSING'
    assert data['traceId']
    assert data['requestId']


def test_trends_media_news_returns_empty_dataset_without_mock_fallback():
    app = create_app()
    app.config['TESTING'] = True

    with app.test_client() as client:
        with patch('apps.web.blueprints.trends_economy._resolve_serpapi_key', return_value='test-key'):
            with patch('apps.web.blueprints.trends_economy.requests.get') as mock_get:
                mock_get.return_value.ok = True
                mock_get.return_value.json.return_value = {'news_results': []}

                response = client.post('/trends/media/news', json={'queries': ['query sin resultados']})

    assert response.status_code == 200
    data = response.get_json()
    assert data['articles'] == []
