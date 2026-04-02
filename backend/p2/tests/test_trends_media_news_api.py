import unittest
from unittest.mock import patch

from flask import Flask

from apps.web.blueprints.trends_economy import trends_bp


class TestTrendsMediaNewsApi(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.register_blueprint(trends_bp)
        self.client = app.test_client()

    @patch('apps.web.blueprints.trends_economy.fetch_google_news_strategy')
    def test_news_endpoint_success(self, mock_fetch):
        mock_fetch.return_value = [
            {
                'title': 'Test',
                'url': 'https://example.com/news',
                'source_name': 'Example',
                'published_at': '2026-04-01',
                'keyword': 'economia',
            }
        ]

        response = self.client.post('/api/trends/media/news', json={'queries': ['economia']})

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload['meta']['queryCount'], 1)
        self.assertEqual(len(payload['items']), 1)
        self.assertTrue(payload.get('requestId'))

    def test_news_endpoint_rejects_invalid_request(self):
        response = self.client.post('/api/trends/media/news', json={'queries': []})

        self.assertEqual(response.status_code, 400)
        payload = response.get_json()
        self.assertEqual(payload['code'], 'TRENDS_INVALID_REQUEST')


if __name__ == '__main__':
    unittest.main()
