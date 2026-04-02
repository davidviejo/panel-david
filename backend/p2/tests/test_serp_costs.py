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


def test_estimate_serp_cost_standard_applies_batch_efficiency():
    estimate = estimate_serp_cost(
        {"provider": "dataforseo", "requireRealtime": False},
        keyword_count=10
    )
    assert estimate["effective_mode"] == "STANDARD"
    assert estimate["batch_efficiency"] <= 1.0
    assert estimate["total_estimated_cost"] > 0


def test_estimate_serp_cost_live_uses_live_rate():
    standard = estimate_serp_cost(
        {"provider": "dataforseo", "requireRealtime": False},
        keyword_count=1
    )
    live = estimate_serp_cost(
        {"provider": "dataforseo", "requireRealtime": True},
        keyword_count=1
    )
    assert live["effective_mode"] == "LIVE"
    assert live["cost_per_keyword"] >= standard["cost_per_keyword"]
