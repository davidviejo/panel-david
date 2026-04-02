from unittest.mock import patch
from apps.web.blueprints.seo_tool import dispatcher


def test_dispatcher_dataforseo_pass_params():
    kw = "test keyword"
    cfg = {
        'mode': 'dataforseo',
        'dfs_login': 'user@example.com',
        'dfs_pass': 'secret',
        'top_n': 10,
        'gl': 'es',
        'hl': 'es'
    }

    with patch('apps.web.blueprints.seo_tool.smart_serp_search') as mock_smart_search:
        mock_smart_search.return_value = [{'url': 'http://example.com', 'title': 'Test', 'rank': 1}]

        resp = dispatcher(kw, cfg)

        mock_smart_search.assert_called_once()
        _, kwargs = mock_smart_search.call_args

        assert kwargs['keyword'] == kw
        assert kwargs['num_results'] == 10
        assert kwargs['lang'] == 'es'
        assert kwargs['country'] == 'es'
        assert kwargs['config']['mode'] == 'dataforseo'
        assert kwargs['config']['return_diagnostics'] is True

        assert resp['status'] == 'ok'
        assert len(resp['results']) == 1
        assert resp['results'][0]['url'] == 'http://example.com'
