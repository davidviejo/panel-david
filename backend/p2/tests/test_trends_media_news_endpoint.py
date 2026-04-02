from unittest.mock import patch


def test_trends_media_news_search_success(client):
    with patch('apps.web.blueprints.trends_economy.smart_serp_search') as mock_search:
        mock_search.return_value = {
            'providerUsed': 'serpapi',
            'results': [
                {
                    'title': 'Titular 1',
                    'link': 'https://example.com/1',
                    'source': 'Example Source',
                    'date': '2026-04-01T12:00:00Z',
                    'snippet': 'Resumen',
                }
            ],
        }

        response = client.post(
            '/api/trends-media/news/search',
            json={'queries': ['economia valencia'], 'provider': 'auto', 'limit': 10},
            headers={'x-request-id': 'req-test-1'},
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data['meta']['providerUsed'] == 'serpapi'
    assert data['meta']['total'] == 1
    assert data['traceId'] == 'req-test-1'
    assert data['requestId'] == 'req-test-1'
    assert data['items'][0]['title'] == 'Titular 1'


def test_trends_media_news_search_empty(client):
    with patch('apps.web.blueprints.trends_economy.smart_serp_search', return_value={'providerUsed': 'internal', 'results': []}):
        response = client.post('/api/trends-media/news/search', json={'queries': ['sin-resultados']})

    assert response.status_code == 200
    data = response.get_json()
    assert data['items'] == []
    assert data['meta']['total'] == 0


def test_trends_media_news_search_invalid_request(client):
    response = client.post('/api/trends-media/news/search', json={'queries': []})

    assert response.status_code == 400
    data = response.get_json()
    assert data['code'] == 'INVALID_REQUEST'
    assert data['traceId']
