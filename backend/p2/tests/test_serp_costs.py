from unittest.mock import patch

from apps.tools.serp_costs import estimate_serp_cost, validate_serp_ranges


def test_validate_serp_ranges_rejects_realtime_batching():
    result = validate_serp_ranges({
        "topN": 10,
        "depth": 10,
        "max_crawl_pages": 1,
        "requireRealtime": True,
        "keyword_count": 3,
    })
    assert result["valid"] is False
    assert any("requireRealtime=true" in err for err in result["errors"])


def test_validate_serp_ranges_blocks_top10_guardrails_depth_and_pages():
    result = validate_serp_ranges({
        "topN": 10,
        "depth": 101,
        "max_crawl_pages": 11,
        "requireRealtime": False,
        "keyword_count": 1,
    })
    assert result["valid"] is False
    assert any("depth" in err for err in result["errors"])
    assert any("max_crawl_pages" in err for err in result["errors"])


def test_estimate_serp_cost_standard_normal():
    estimate = estimate_serp_cost(
        {"provider": "dataforseo", "requireRealtime": False},
        keyword_count=10
    )
    assert estimate["effective_mode"] == "STANDARD"
    assert estimate["batch_efficiency"] <= 1.0
    assert estimate["total_estimated_cost"] > 0


def test_estimate_serp_cost_standard_high_request_clamps_batch_efficiency():
    with patch.dict('os.environ', {"SERP_STANDARD_BATCH_EFFICIENCY": "3.0"}):
        estimate = estimate_serp_cost(
            {"provider": "dataforseo", "requireRealtime": False},
            keyword_count=10_000
        )
    assert estimate["effective_mode"] == "STANDARD"
    assert estimate["keyword_count"] == 10_000
    assert estimate["batch_efficiency"] == 1.0


def test_estimate_serp_cost_live_when_require_realtime_true():
    standard = estimate_serp_cost(
        {"provider": "dataforseo", "requireRealtime": False},
        keyword_count=1
    )
    live = estimate_serp_cost(
        {"provider": "dataforseo", "requireRealtime": True},
        keyword_count=1
    )
    assert live["effective_mode"] == "LIVE"
    assert live["batch_efficiency"] == 1.0
    assert live["cost_per_keyword"] >= standard["cost_per_keyword"]
