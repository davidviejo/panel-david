import glob
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


CONTRACT_VERSION = "1.0"
CONTRACT_ID = "portal.project-overview.v1"


def _base_data_dir() -> str:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "..", "data")


def _base_snapshots_dir() -> str:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "..", "snapshots")


def _load_projects() -> List[Dict[str, Any]]:
    projects_path = os.path.join(_base_data_dir(), "projects_db.json")
    try:
        with open(projects_path, "r", encoding="utf-8") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _find_project_id(slug: str) -> Optional[str]:
    project = next((item for item in _load_projects() if item.get("name") == slug), None)
    if not project:
        return None
    project_id = project.get("id")
    return str(project_id) if project_id is not None else None


def _load_latest_snapshot(project_id: str) -> List[Dict[str, Any]]:
    snapshots_dir = _base_snapshots_dir()
    preferred_path = os.path.join(snapshots_dir, f"proj_{project_id}_latest.json")
    if os.path.exists(preferred_path):
        try:
            with open(preferred_path, "r", encoding="utf-8") as file:
                payload = json.load(file)
                return payload if isinstance(payload, list) else []
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    matches = glob.glob(os.path.join(snapshots_dir, f"proj_{project_id}_*.json"))
    if not matches:
        return []

    latest_match = max(matches, key=os.path.getmtime)
    try:
        with open(latest_match, "r", encoding="utf-8") as file:
            payload = json.load(file)
            return payload if isinstance(payload, list) else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _safe_int(value: Any) -> Optional[int]:
    try:
        parsed = int(value)
        return parsed
    except (TypeError, ValueError):
        return None


def build_project_overview(slug: str) -> Optional[Dict[str, Any]]:
    project_id = _find_project_id(slug)
    if not project_id:
        return None

    snapshot_rows = _load_latest_snapshot(project_id)
    total_urls = len(snapshot_rows)

    status_200_count = 0
    score_sum = 0
    score_count = 0
    issue_frequency: Dict[str, int] = {}

    for row in snapshot_rows:
        status = _safe_int(row.get("status"))
        if status == 200:
            status_200_count += 1

        score = _safe_int(row.get("score"))
        if score is not None:
            score_sum += score
            score_count += 1

        raw_issues = row.get("issues")
        if isinstance(raw_issues, list):
            for issue in raw_issues:
                if isinstance(issue, str) and issue.strip():
                    issue_frequency[issue.strip()] = issue_frequency.get(issue.strip(), 0) + 1

    health_score = round(score_sum / score_count) if score_count else 0
    issues_open = sum(issue_frequency.values())
    top_issues = [
        {"message": issue, "count": count}
        for issue, count in sorted(issue_frequency.items(), key=lambda item: item[1], reverse=True)[:5]
    ]

    return {
        "contract": {
            "id": CONTRACT_ID,
            "version": CONTRACT_VERSION,
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "project": {
            "slug": slug,
            "project_id": project_id,
        },
        "metrics": {
            "urls_tracked": total_urls,
            "urls_ok": status_200_count,
            "health_score": health_score,
            "issues_open": issues_open,
        },
        "recent_issues": top_issues,
        # Legacy compatibility fields used by current portal cards.
        "traffic": str(total_urls),
        "keywords_top3": 0,
        "health_score": health_score,
        "recent_issues_legacy": [issue["message"] for issue in top_issues],
    }
