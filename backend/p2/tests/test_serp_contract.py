from unittest.mock import patch

from apps.tools.credentials import resolve_dataforseo_credentials
from apps.tools.scraper_core import build_dataforseo_request, normalize_serp_config, smart_serp_search


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


def test_build_dataforseo_request_defaults_to_standard_endpoint():
    req = build_dataforseo_request({}, "test keyword", 10, "es", "es")
    assert req["endpoint_url"].endswith("/task_post")
    assert req["payload"][0]["depth"] == 100


def test_build_dataforseo_request_uses_live_when_require_realtime():
    req = build_dataforseo_request({"requireRealtime": True, "depth": 55}, "test keyword", 10, "en", "us")
    assert req["endpoint_url"].endswith("/live/advanced")
    assert req["payload"][0]["location_name"] == "United States"
    assert req["payload"][0]["depth"] == 55


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
    mock_dfs.return_value = [{"url": "https://example.com", "title": "ok", "snippet": "", "rank": 1}]

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
