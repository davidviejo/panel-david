import logging
from typing import Any, Dict, Optional


def apply_seo_limits_policy(
    top_n: int,
    depth: Optional[int],
    max_crawl_pages: Optional[int],
    *,
    enforcement_mode: str = "block",
    source: str = "unknown"
) -> Dict[str, Any]:
    """
    Política central para normalizar y validar límites SEO.

    Regla principal:
    - Si top_n <= 10: forzar depth=10 y max_crawl_pages=1.
    - En ese flujo, si se envía depth>10 o max_crawl_pages>1:
      - enforcement_mode='block' => bloquear con error.
      - enforcement_mode='autocorrect' => autocorregir y avisar.
    """
    normalized_depth = depth
    normalized_max_crawl_pages = max_crawl_pages
    warnings = []
    block_reason = None
    adjusted = False

    if top_n <= 10:
        requested_depth = depth
        requested_max_pages = max_crawl_pages

        invalid_depth = requested_depth is not None and requested_depth > 10
        invalid_max_pages = requested_max_pages is not None and requested_max_pages > 1

        if invalid_depth or invalid_max_pages:
            block_reason = (
                "Con topN <= 10 no se permite depth > 10 ni max_crawl_pages > 1."
            )
            if enforcement_mode == "block":
                logging.info(
                    "[seo_limits_policy] source=%s topN=%s depth=%s max_crawl_pages=%s decision=blocked reason=%s",
                    source,
                    top_n,
                    requested_depth,
                    requested_max_pages,
                    block_reason
                )
                return {
                    "blocked": True,
                    "adjusted": False,
                    "warnings": [],
                    "block_reason": block_reason,
                    "top_n": top_n,
                    "depth": requested_depth,
                    "max_crawl_pages": requested_max_pages
                }
            warnings.append(
                f"{block_reason} Se aplicó autocorrección a depth=10 y max_crawl_pages=1."
            )

        if requested_depth != 10 or requested_max_pages != 1:
            adjusted = True
            if not warnings:
                warnings.append(
                    "Con topN <= 10 se aplicó la política: depth=10 y max_crawl_pages=1."
                )

        normalized_depth = 10
        normalized_max_crawl_pages = 1

    logging.info(
        "[seo_limits_policy] source=%s topN=%s requested_depth=%s requested_max_crawl_pages=%s "
        "applied_depth=%s applied_max_crawl_pages=%s decision=%s adjusted=%s warnings=%s",
        source,
        top_n,
        depth,
        max_crawl_pages,
        normalized_depth,
        normalized_max_crawl_pages,
        "blocked" if block_reason and enforcement_mode == "block" else "applied",
        adjusted,
        warnings
    )

    return {
        "blocked": False,
        "adjusted": adjusted,
        "warnings": warnings,
        "block_reason": None,
        "top_n": top_n,
        "depth": normalized_depth,
        "max_crawl_pages": normalized_max_crawl_pages
    }
