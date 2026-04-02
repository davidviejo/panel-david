import os
from typing import Any, Dict, Optional


def _to_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def _safe_int(value: Any, default: Optional[int] = None) -> Optional[int]:
    if value is None:
        return default
    if isinstance(value, bool):
        return int(value)
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return default


def validate_serp_ranges(config: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Valida y normaliza rangos SERP para flujos optimizados:
    - topN permitido: 1..10
    - depth: 1..100
    - max_crawl_pages: 1..10
    - coherencia requireRealtime + batching: LIVE no permite batch > 1 keyword.
    """
    cfg = dict(config or {})
    top_n = _safe_int(cfg.get("topN", cfg.get("top_n")), 10)
    depth = _safe_int(cfg.get("depth"), 10)
    max_crawl_pages = _safe_int(cfg.get("max_crawl_pages", cfg.get("maxCrawlPages")), 1)
    require_realtime = _to_bool(cfg.get("requireRealtime", cfg.get("require_realtime")), False)
    batch_size = _safe_int(cfg.get("batch_size", cfg.get("batchSize")), 1) or 1
    keyword_count = _safe_int(cfg.get("keyword_count", cfg.get("keywordCount")), batch_size) or batch_size

    errors = []
    if top_n is None or top_n < 1 or top_n > 10:
        errors.append("topN debe estar entre 1 y 10 en flujo optimizado.")
    if depth is None or depth < 1 or depth > 100:
        errors.append("depth debe estar entre 1 y 100.")
    if max_crawl_pages is None or max_crawl_pages < 1 or max_crawl_pages > 10:
        errors.append("max_crawl_pages debe estar entre 1 y 10.")
    if require_realtime and keyword_count > 1:
        errors.append("Con requireRealtime=true no se permite batching de múltiples keywords.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "topN": top_n,
        "depth": depth,
        "max_crawl_pages": max_crawl_pages,
        "requireRealtime": require_realtime,
        "keyword_count": keyword_count,
    }


def estimate_serp_cost(config: Optional[Dict[str, Any]], keyword_count: int) -> Dict[str, Any]:
    """
    Estima coste SERP con desglose reutilizable.
    - STANDARD usa eficiencia por batch (descuento configurable).
    - LIVE usa tarifa dedicada sin eficiencia.
    """
    cfg = dict(config or {})
    provider = (cfg.get("serp_provider") or cfg.get("provider") or "dataforseo").strip().lower()
    require_realtime = _to_bool(cfg.get("requireRealtime", cfg.get("require_realtime")), False)
    effective_mode = "LIVE" if require_realtime else "STANDARD"

    normalized_kw_count = max(1, int(keyword_count or 1))

    standard_rate = float(os.environ.get("SERP_STANDARD_COST_PER_KEYWORD", 0.002))
    live_rate = float(os.environ.get("SERP_LIVE_COST_PER_KEYWORD", 0.006))
    serpapi_rate = float(os.environ.get("SERPAPI_COST_PER_QUERY", 0.01))
    internal_rate = 0.0

    batch_efficiency = 1.0
    if effective_mode == "STANDARD":
        batch_efficiency = float(os.environ.get("SERP_STANDARD_BATCH_EFFICIENCY", 0.7))
        batch_efficiency = min(max(batch_efficiency, 0.1), 1.0)

    if provider == "serpapi":
        base_rate = serpapi_rate
    elif provider == "internal":
        base_rate = internal_rate
    else:
        base_rate = live_rate if effective_mode == "LIVE" else standard_rate

    cost_per_keyword = round(base_rate * batch_efficiency, 6) if effective_mode == "STANDARD" else round(base_rate, 6)
    total_estimated_cost = round(cost_per_keyword * normalized_kw_count, 6)

    return {
        "provider": provider,
        "effective_mode": effective_mode,
        "keyword_count": normalized_kw_count,
        "base_rate_per_keyword": round(base_rate, 6),
        "batch_efficiency": round(batch_efficiency, 6),
        "batch_efficiency_applied": effective_mode == "STANDARD" and batch_efficiency < 1.0,
        "cost_per_keyword": cost_per_keyword,
        "total_estimated_cost": total_estimated_cost,
        "currency": "USD",
    }
