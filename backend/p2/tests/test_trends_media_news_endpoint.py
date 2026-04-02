from unittest.mock import patch


def test_trends_media_news_success(client):
    with patch('apps.web.blueprints.trends_economy._fetch_news_serpapi') as fetch_mock:
        fetch_mock.return_value = [
            {
                'title': 'Titular',
                'url': 'https://example.com',
                'sourceName': 'Fuente',
                'publishedAt': '2026-04-02T00:00:00Z',
                'position': 1,
                'keyword': 'economia',
                'snippet': 'Resumen',
            }
        ]
        response = client.post('/api/trends/media/news', json={'queries': ['economia'], 'provider': 'serpapi'})

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['provider'] == 'serpapi'
    assert len(payload['items']) == 1
    assert payload.get('traceId')
    assert response.headers.get('X-Trace-Id')


def test_trends_media_news_empty_queries_returns_400(client):
    response = client.post('/api/trends/media/news', json={'queries': []})
    assert response.status_code == 400
    payload = response.get_json()
    assert payload['code'] == 'BAD_REQUEST'
