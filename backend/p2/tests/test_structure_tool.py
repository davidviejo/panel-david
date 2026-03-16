import unittest
from unittest.mock import patch, MagicMock
from apps.web.blueprints.structure_tool import get_struct
import json

class TestStructureTool(unittest.TestCase):

    def setUp(self):
        from apps.web import create_app
        from apps.core.config import Config
        class TestConfig(Config):
            TESTING = True
            SECRET_KEY = 'test'
            JWT_SECRET = 'test'
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    @patch('apps.web.blueprints.structure_tool.is_safe_url')
    @patch('apps.web.blueprints.structure_tool.requests.get')
    def test_get_struct_success(self, mock_get, mock_is_safe):
        mock_is_safe.return_value = True
        mock_resp = MagicMock()
        mock_resp.content = b"""
        <html>
            <body>
                <h1>Title 1</h1>
                <nav><h1>Nav Header</h1></nav>
                <div>
                    <h2>Subtitle 1</h2>
                    <h3>Small title</h3>
                </div>
                <footer><h3>Footer Header</h3></footer>
                <script><h2>Script Header</h2></script>
                <style><h1>Style Header</h1></style>
            </body>
        </html>
        """
        mock_get.return_value = mock_resp

        result = get_struct("http://example.com")

        self.assertEqual(result['url'], "http://example.com")
        # Should only contain h1, h2, h3 NOT in nav, footer, script, style
        expected_headers = [
            {'tag': 'H1', 'txt': 'Title 1'},
            {'tag': 'H2', 'txt': 'Subtitle 1'},
            {'tag': 'H3', 'txt': 'Small title'}
        ]
        self.assertEqual(result['headers'], expected_headers)

    @patch('apps.web.blueprints.structure_tool.is_safe_url')
    def test_get_struct_unsafe_url(self, mock_is_safe):
        mock_is_safe.return_value = False
        result = get_struct("http://unsafe.com")
        self.assertEqual(result['url'], "http://unsafe.com")
        self.assertEqual(result['headers'], [])

    @patch('apps.web.blueprints.structure_tool.is_safe_url')
    @patch('apps.web.blueprints.structure_tool.requests.get')
    def test_get_struct_request_exception(self, mock_get, mock_is_safe):
        mock_is_safe.return_value = True
        mock_get.side_effect = Exception("Connection error")

        result = get_struct("http://error.com")
        self.assertEqual(result['url'], "http://error.com")
        self.assertEqual(result['headers'], [])

    @patch('apps.web.blueprints.structure_tool.get_struct')
    def test_analyze_route(self, mock_get_struct):
        # Setup mock return values for get_struct
        def side_effect(url):
            return {'url': url, 'headers': [{'tag': 'H1', 'txt': 'Test'}]}
        mock_get_struct.side_effect = side_effect

        payload = {'urls': ['http://test1.com', 'http://test2.com']}
        response = self.client.post('/structure/analyze',
                                    data=json.dumps(payload),
                                    content_type='application/json')

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(len(data['data']), 2)
        self.assertEqual(data['data'][0]['url'], 'http://test1.com')
        self.assertEqual(data['data'][1]['url'], 'http://test2.com')

if __name__ == '__main__':
    unittest.main()
