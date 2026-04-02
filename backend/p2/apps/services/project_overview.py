from __future__ import annotations

import glob
import json
import os
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from apps.web.clients_store import find_client_by_slug

CONTRACT_VERSION = '2026-04-portal-overview-v1'


class ProjectOverviewNotFoundError(Exception):
    """Raised when project slug does not exist in clients store."""


def _normalize_text(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', '', value.lower())


def _reports_dir() -> str:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, '..', 'reports')


def _extract_report_epoch(path: str) -> int:
    filename = os.path.basename(path)
    matches = re.findall(r'(\d+)', filename)
    if not matches:
        return 0
    return int(matches[-1])


def _select_latest_report_for_slug(slug: str, project_name: str) -> Optional[Dict[str, Any]]:
    normalized_slug = _normalize_text(slug)
    normalized_project_name = _normalize_text(project_name)

    candidates = sorted(glob.glob(os.path.join(_reports_dir(), 'report_*.json')), key=_extract_report_epoch, reverse=True)

    for path in candidates:
        try:
            with open(path, 'r', encoding='utf-8') as handle:
                payload = json.load(handle)
        except (FileNotFoundError, json.JSONDecodeError, OSError):
            continue

        report_name = _normalize_text(str(payload.get('project_name', '')))
        if not report_name:
            continue

        if normalized_slug and normalized_slug in report_name:
            return payload
        if normalized_project_name and normalized_project_name in report_name:
            return payload

    return None


def _format_compact_number(value: Optional[int]) -> Optional[str]:
    if value is None:
        return None
    if value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    if value >= 1_000:
        return f"{value / 1_000:.1f}K"
    return str(value)


def _build_metrics_from_report(report: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    pages = report.get('data') if isinstance(report, dict) else None
    if not isinstance(pages, list) or not pages:
        return {
            'keywords_top3': {'value': 0},
            'health_score': {'value': 0, 'scale_max': 100},
            'recent_issues': [],
            'source': 'crawler_report',
            'is_empty': True,
        }

    scores = [int(page.get('score')) for page in pages if isinstance(page.get('score'), (int, float))]
    health_score = round(sum(scores) / len(scores)) if scores else 0
    keywords_top3 = len([score for score in scores if score >= 90])

    issue_counter: Counter[str] = Counter()
    for page in pages:
        groups = page.get('groups') if isinstance(page, dict) else None
        if not isinstance(groups, dict):
            continue
        for group in groups.values():
            issues = group.get('issues') if isinstance(group, dict) else None
            if not isinstance(issues, list):
                continue
            for issue in issues:
                if isinstance(issue, str) and issue.strip():
                    issue_counter[issue.strip()] += 1

    recent_issues = [
        {'issue': issue, 'count': count}
        for issue, count in issue_counter.most_common(5)
    ]

    return {
        'keywords_top3': {'value': keywords_top3},
        'health_score': {'value': health_score, 'scale_max': 100},
        'recent_issues': recent_issues,
        'source': 'crawler_report',
        'is_empty': len(scores) == 0,
    }


def build_project_overview_contract(slug: str) -> Dict[str, Any]:
    client = find_client_by_slug(slug)
    if not client:
        raise ProjectOverviewNotFoundError(slug)

    report = _select_latest_report_for_slug(slug, str(client.get('name', '')))
    report_metrics = _build_metrics_from_report(report)

    organic_traffic_value = None
    metrics_block = client.get('metrics') if isinstance(client.get('metrics'), dict) else {}
    candidate_traffic = metrics_block.get('organic_traffic_estimate') if isinstance(metrics_block, dict) else None
    if isinstance(candidate_traffic, (int, float)):
        organic_traffic_value = int(candidate_traffic)

    return {
        'contract_version': CONTRACT_VERSION,
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'project': {
            'slug': client.get('slug'),
            'name': client.get('name') or slug,
            'status': client.get('status') or 'unknown',
        },
        'metrics': {
            'organic_traffic_estimate': {
                'value': organic_traffic_value,
                'formatted': _format_compact_number(organic_traffic_value),
                'unit': 'monthly_visits',
            },
            **report_metrics,
        },
    }
