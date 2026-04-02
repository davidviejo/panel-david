from unittest.mock import MagicMock, patch

from apps.tools.credentials import resolve_dataforseo_credentials
from apps.tools.scraper_core import (
    _parse_dataforseo_task_results,
    build_dataforseo_request,
    normalize_serp_config,
    search_dataforseo,
    smart_serp_search,
)


def test_normalize_serp_config_accepts_legacy_aliases():
    cfg = normalize_serp_config({
        "mode": "google_api_official",
        "provider": "google_api_official",
        "dfs_login": "legacy-login",
        "dfs_pass": "legacy-pass",
        "cse_key": "legacy-key",
        "cse_cx": "legacy-cx",
    })

    assert cfg["mode"] == "google_official"
    assert cfg["serp_provider"] == "google_official"
    assert cfg["dataforseo_login"] == "legacy-login"
    assert cfg["dataforseo_password"] == "legacy-pass"
    assert cfg["google_cse_key"] == "legacy-key"
    assert cfg["google_cse_cx"] == "legacy-cx"


def test_normalize_serp_config_accepts_dataforseo_internal_contract_fields():
    cfg = normalize_serp_config({
        "requireRealtime": True,
        "topN": 15,
        "depth": 120,
        "maxCrawlPages": 7,
    })

    assert cfg["requireRealtime"] is True
    assert cfg["topN"] == 15
    assert cfg["depth"] == 120
    assert cfg["max_crawl_pages"] == 7




def test_build_dataforseo_request_standard_respects_requested_depth():
    req = build_dataforseo_request({"requireRealtime": False, "depth": 77}, "test keyword", 10, "es", "es")
    assert req["effective_mode"] == "STANDARD"
    assert req["payload"][0]["depth"] == 77


def test_build_dataforseo_request_rejects_invalid_depth():
    try:
        build_dataforseo_request({"requireRealtime": False, "depth": 0}, "test keyword", 10, "es", "es")
        assert False, "Expected ValueError for invalid depth"
    except ValueError as exc:
        assert "depth" in str(exc)


def test_build_dataforseo_request_defaults_to_standard_endpoint():
    req = build_dataforseo_request({}, "test keyword", 10, "es", "es")
    assert req["endpoint_url"].endswith("/task_post")
    assert req["payload"][0]["depth"] == 10


def test_build_dataforseo_request_payload_uses_top10_policy_defaults():
    req = build_dataforseo_request(
        {"topN": 10, "max_crawl_pages": 1, "requireRealtime": True},
        "test keyword",
        10,
        "es",
        "es",
    )

    assert req["payload"][0]["depth"] == 10
    assert req["max_crawl_pages"] == 1
    assert req["require_realtime"] is True


def test_build_dataforseo_request_uses_live_when_require_realtime():
    req = build_dataforseo_request({"requireRealtime": True, "depth": 55}, "test keyword", 10, "en", "us")
    assert req["endpoint_url"].endswith("/live/advanced")
    assert req["payload"][0]["location_name"] == "United States"
    assert req["payload"][0]["depth"] == 55


def test_build_dataforseo_request_batches_keywords_in_standard_mode():
    req = build_dataforseo_request(
        {"requireRealtime": False},
        "fallback keyword",
        10,
        "es",
        "es",
        keywords=["kw one", "kw two"],
    )
    assert req["endpoint_url"].endswith("/task_post")
    assert len(req["payload"]) == 2
    assert req["batching_applied"] is True
    assert req["effective_mode"] == "STANDARD"
    assert req["keywords_processed"] == ["kw one", "kw two"]


def test_build_dataforseo_request_live_rejects_keyword_batching_when_realtime():
    try:
        build_dataforseo_request(
            {"requireRealtime": True},
            "fallback keyword",
            10,
            "es",
            "es",
            keywords=["kw one", "kw two"],
        )
        assert False, "Expected ValueError for realtime batching"
    except ValueError as exc:
        assert "requireRealtime=true" in str(exc)


@patch("apps.tools.scraper_core.search_google_official")
def test_smart_serp_search_supports_google_mode_alias(mock_google):
    mock_google.return_value = [{"url": "https://example.com", "title": "ok", "snippet": "", "rank": 1}]

    result = smart_serp_search(
        "test keyword",
        config={"mode": "google_api_official", "cse_key": "k", "cse_cx": "cx"},
        num_results=1,
    )

    assert len(result) == 1
    mock_google.assert_called_once_with("test keyword", "k", "cx", 1, gl="es", hl="es")


@patch("apps.tools.scraper_core.search_dataforseo")
def test_smart_serp_search_prefers_canonical_dataforseo_keys(mock_dfs):
    mock_dfs.return_value = {
        "results": [{"url": "https://example.com", "title": "ok", "snippet": "", "rank": 1}],
        "diagnostics": {"batching_applied": False, "batch_size": 1, "keywords_processed": ["test keyword"]},
    }

    result = smart_serp_search(
        "test keyword",
        config={
            "mode": "dataforseo",
            "dataforseo_login": "canonical-login",
            "dataforseo_password": "canonical-password",
        },
        num_results=1,
    )

    assert len(result) == 1
    mock_dfs.assert_called_once()
    args, kwargs = mock_dfs.call_args
    assert args[:6] == ("test keyword", "canonical-login", "canonical-password", 1, "es", "es")
    assert kwargs["config"]["mode"] == "dataforseo"
    assert kwargs["config"]["requireRealtime"] is False
    assert kwargs["return_meta"] is True


@patch("apps.tools.scraper_core.search_dataforseo")
def test_smart_serp_search_exposes_batching_in_diagnostics(mock_dfs):
    mock_dfs.return_value = {
        "results": [{"url": "https://example.com", "title": "ok", "snippet": "", "rank": 1}],
        "diagnostics": {
            "mode": "dataforseo_standard",
            "batching_applied": True,
            "batch_size": 2,
            "keywords_processed": ["k1", "k2"],
        },
    }

    result = smart_serp_search(
        ["k1", "k2"],
        config={
            "mode": "dataforseo",
            "dataforseo_login": "canonical-login",
            "dataforseo_password": "canonical-password",
            "return_diagnostics": True,
        },
        num_results=1,
    )

    assert result["diagnostics"]["batching_applied"] is True
    assert result["diagnostics"]["batch_size"] == 2
    assert result["diagnostics"]["keywords_processed"] == ["k1", "k2"]


@patch("apps.tools.scraper_core.scrape_google_serp")
def test_smart_serp_search_google_scraping_passes_gl_hl(mock_scrape):
    mock_scrape.return_value = {
        "results": [{"url": "https://example.com", "title": "ok"}],
        "http_status": 200,
        "blocked": False,
        "mode": "gbv_legacy",
        "elapsed_ms": 20,
    }

    result = smart_serp_search(
        "test keyword",
        config={"mode": "google_scraping"},
        num_results=1,
        lang="en",
        country="us",
    )

    assert len(result) == 1
    mock_scrape.assert_called_once()
    args, kwargs = mock_scrape.call_args
    assert args == ("test keyword", 1, 2)
    assert kwargs["cookie"] is None
    assert kwargs["gl"] == "us"
    assert kwargs["hl"] == "en"


def test_resolve_dataforseo_credentials_supports_canonical_override():
    with patch("apps.tools.credentials.get_user_settings", return_value={}):
        creds = resolve_dataforseo_credentials({
            "dataforseo_login": "canonical-login",
            "dataforseo_password": "canonical-password",
        })

    assert creds["login"] == "canonical-login"
    assert creds["password"] == "canonical-password"


def test_parse_dataforseo_task_results_normalizes_live_and_standard_fields():
    task = {
        "result": [{
            "items": [
                {"type": "organic", "url": "https://one.test", "title": "One", "description": "Desc", "rank_group": 1},
                {"type": "organic", "url": "https://two.test", "title": "Two", "snippet": "Snippet", "rank_absolute": 2},
            ]
        }]
    }
    results = _parse_dataforseo_task_results(task)
    assert results == [
        {"url": "https://one.test", "title": "One", "snippet": "Desc", "rank": 1},
        {"url": "https://two.test", "title": "Two", "snippet": "Snippet", "rank": 2},
    ]


@patch("apps.tools.scraper_core.time.sleep")
@patch("apps.tools.scraper_core.requests.get")
@patch("apps.tools.scraper_core.requests.post")
def test_search_dataforseo_standard_polls_tasks_ready_and_task_get(mock_post, mock_get, _mock_sleep):
    task_post_response = MagicMock()
    task_post_response.status_code = 200
    task_post_response.json.return_value = {
        "status_code": 20000,
        "tasks": [{"id": "task-1"}],
    }
    tasks_ready_response = MagicMock()
    tasks_ready_response.status_code = 200
    tasks_ready_response.json.return_value = {
        "status_code": 20000,
        "tasks": [{"id": "task-1"}],
    }
    mock_post.side_effect = [task_post_response, tasks_ready_response]

    task_get_response = MagicMock()
    task_get_response.status_code = 200
    task_get_response.json.return_value = {
        "status_code": 20000,
        "tasks": [{
            "id": "task-1",
            "result": [{
                "items": [{
                    "type": "organic",
                    "url": "https://example.com",
                    "title": "Example",
                    "description": "Example snippet",
                    "rank_group": 1,
                }]
            }],
        }],
    }
    mock_get.return_value = task_get_response

    response = search_dataforseo(
        "kw",
        "login",
        "pass",
        num_results=10,
        config={"requireRealtime": False, "dfs_poll_timeout_s": 5, "dfs_poll_interval_s": 0.1},
        return_meta=True,
    )

    assert response["results"][0]["url"] == "https://example.com"
    assert response["full_results"][0]["url"] == "https://example.com"
    assert response["full_results_by_keyword"]["kw"][0]["url"] == "https://example.com"
    assert response["diagnostics"]["task_ids"] == ["task-1"]
    assert response["diagnostics"]["timed_out"] is False


@patch("apps.tools.scraper_core.time.sleep")
@patch("apps.tools.scraper_core.requests.get")
@patch("apps.tools.scraper_core.requests.post")
def test_search_dataforseo_standard_polls_until_task_get_has_items_when_tasks_ready_uses_nested_ids(mock_post, mock_get, _mock_sleep):
    task_post_response = MagicMock()
    task_post_response.status_code = 200
    task_post_response.json.return_value = {
        "status_code": 20000,
        "tasks": [{"id": "task-1"}],
    }
    tasks_ready_response = MagicMock()
    tasks_ready_response.status_code = 200
    tasks_ready_response.json.return_value = {
        "status_code": 20000,
        "tasks": [{
            "result": [{
                "items": [{"id": "task-1"}],
            }],
        }],
    }
    mock_post.side_effect = [task_post_response, tasks_ready_response, tasks_ready_response]

    first_task_get_response = MagicMock()
    first_task_get_response.status_code = 200
    first_task_get_response.json.return_value = {
        "status_code": 20000,
        "tasks": [{"id": "task-1", "result": [{"items": []}]}],
    }
    second_task_get_response = MagicMock()
    second_task_get_response.status_code = 200
    second_task_get_response.json.return_value = {
        "status_code": 20000,
        "tasks": [{
            "id": "task-1",
            "result": [{
                "items": [{
                    "type": "organic",
                    "url": "https://later.example.com",
                    "title": "Later",
                    "snippet": "Loaded later",
                    "rank_group": 1,
                }],
            }],
        }],
    }
    mock_get.side_effect = [first_task_get_response, second_task_get_response]

    response = search_dataforseo(
        "kw",
        "login",
        "pass",
        num_results=10,
        config={"requireRealtime": False, "dfs_poll_timeout_s": 5, "dfs_poll_interval_s": 0.1},
        return_meta=True,
    )

    assert response["results"][0]["url"] == "https://later.example.com"
    assert response["diagnostics"]["timed_out"] is False
    assert mock_get.call_count == 2
