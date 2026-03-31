from flask import Blueprint, request, jsonify, make_response, session, redirect, url_for
from apps.auth_utils import verify_token
from apps.web.clients_store import get_safe_clients
from apps.core.database import get_user_settings
from apps.tools.llm_service import _query_google, _query_openai
from functools import wraps
import os
import json

portal_bp = Blueprint('portal_bp', __name__)

WEB_AUTH_COOKIE = 'portal_auth_token'


def _extract_bearer_token_from_header():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ', 1)[1].strip()
    return None


def _get_payload_from_token(token):
    if not token:
        return None
    return verify_token(token)


def _get_web_payload():
    """
    Resolve auth payload for HTML views.
    Priority: Flask session payload -> JWT in session -> JWT in HttpOnly cookie -> Bearer header.
    """
    payload = session.get('auth_payload')
    if payload:
        return payload

    for token in (
        session.get('auth_token'),
        request.cookies.get(WEB_AUTH_COOKIE),
        _extract_bearer_token_from_header(),
    ):
        payload = _get_payload_from_token(token)
        if payload:
            session['auth_payload'] = payload
            return payload

    return None

def require_role(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = _extract_bearer_token_from_header()
            if not token:
                return jsonify({'error': 'Missing or invalid Authorization header'}), 401

            payload = _get_payload_from_token(token)

            if not payload:
                return jsonify({'error': 'Invalid or expired token'}), 401

            if payload.get('role') not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403

            # For project role, verify scope if applicable
            if payload.get('role') == 'project':
                # Assuming the route has a <slug> parameter, or we check against something else
                # In this simple implementation, we might just pass the payload to the function
                # or attach it to request.
                pass

            request.user_payload = payload
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_role_web(allowed_roles, login_endpoint='home'):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            payload = _get_web_payload()

            if not payload:
                return redirect(url_for(login_endpoint))

            if payload.get('role') not in allowed_roles:
                return redirect(url_for(login_endpoint))

            request.user_payload = payload
            return f(*args, **kwargs)

        return decorated_function

    return decorator

@portal_bp.route('/api/clients', methods=['GET'])
@require_role(['clients_area', 'operator'])
def list_clients():
    return jsonify(get_safe_clients())

@portal_bp.route('/api/public/clients', methods=['GET'])
def list_public_clients():
    response = make_response(jsonify(get_safe_clients()))
    response.headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300'
    return response

@portal_bp.route('/api/<slug>/overview', methods=['GET'])
@require_role(['project', 'clients_area', 'operator'])
def project_overview(slug):
    # If role is project, ensure scope matches slug
    payload = request.user_payload
    if payload.get('role') == 'project' and payload.get('scope') != slug:
        return jsonify({'error': 'Access denied for this project'}), 403

    # Return mock data
    return jsonify({
        "project": slug,
        "traffic": "12.5K",
        "keywords_top3": 45,
        "health_score": 92,
        "recent_issues": [
            "Missing H1 on 3 pages",
            "Slow LCP on homepage"
        ]
    })

@portal_bp.route('/api/tools/run/<tool>', methods=['POST'])
@require_role(['operator'])
def run_tool(tool):
    # Dummy endpoint
    return jsonify({
        "status": "accepted",
        "message": f"Tool {tool} execution queued (dummy)",
        "tool": tool
    })


@portal_bp.route('/api/ai/visibility/analyze', methods=['POST'])
@require_role(['project', 'clients_area', 'operator'])
def ai_visibility_analyze():
    payload = request.user_payload
    data = request.get_json(silent=True) or {}

    provider = (data.get('provider') or 'gemini').strip().lower()
    scope = (data.get('scope') or '').strip()
    clusters = data.get('clusters') or []

    if not isinstance(clusters, list) or not clusters:
        return jsonify({'error': 'clusters es requerido y debe ser una lista no vacía'}), 400

    # Evitar acceso cruzado: el rol "project" solo puede consultar su propio scope.
    if payload.get('role') == 'project':
        token_scope = (payload.get('scope') or '').strip()
        if not token_scope:
            return jsonify({'error': 'Missing project scope in token'}), 403
        if scope and scope != token_scope:
            return jsonify({'error': 'Access denied for this project scope'}), 403
        scope = token_scope

    trimmed_clusters = clusters[:50]
    items_to_analyze = []
    for cluster in trimmed_clusters:
        if not isinstance(cluster, dict):
            continue
        articles = cluster.get('articles') or []
        snippet = ''
        if isinstance(articles, list) and articles and isinstance(articles[0], dict):
            snippet = articles[0].get('snippet') or ''
        items_to_analyze.append({
            'id': cluster.get('cluster_id'),
            'title': cluster.get('title'),
            'source': cluster.get('top_source'),
            'technical_score': cluster.get('score'),
            'articles_count': cluster.get('coverage_count'),
            'snippet': snippet,
        })

    if not items_to_analyze:
        return jsonify({'error': 'No hay clusters válidos para analizar'}), 400

    system_instruction = (
        "Analiza clusters de noticias y responde SIEMPRE con JSON array válido. "
        "Cada objeto debe incluir: id, suggestedTitle, summary, priority (P1|P2|P3|DISCARD), "
        "category (Turismo|Empresa|Innovación|Eventos|Movilidad|Economía|Otros), reasoning."
    )
    prompt = (
        f"{system_instruction}\n\n"
        f"Scope permitido: {scope or 'global'}\n"
        f"Clusters:\n{json.dumps(items_to_analyze, ensure_ascii=False)}"
    )

    settings = get_user_settings('default')
    openai_key = settings.get('openai_key') or session.get('openai_key') or os.getenv('OPENAI_API_KEY')
    gemini_key = session.get('google_key') or os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')

    if provider == 'openai':
        raw_result = _query_openai(prompt, model='gpt-4o-mini', api_key=openai_key)
    else:
        raw_result = _query_google(prompt, model='gemini-2.0-flash', api_key=gemini_key)

    try:
        ai_results = json.loads(raw_result)
        if not isinstance(ai_results, list):
            raise ValueError('invalid result')
    except Exception:
        ai_results = []

    ai_by_id = {
        item.get('id'): item
        for item in ai_results
        if isinstance(item, dict) and item.get('id')
    }

    merged = []
    for cluster in trimmed_clusters:
        cluster_id = cluster.get('cluster_id')
        ai_result = ai_by_id.get(cluster_id)
        if ai_result:
            cluster['ai_analysis'] = {
                'suggestedTitle': ai_result.get('suggestedTitle') or cluster.get('title') or '',
                'summary': ai_result.get('summary') or '',
                'priority': ai_result.get('priority') or 'DISCARD',
                'category': ai_result.get('category') or 'Otros',
                'reasoning': ai_result.get('reasoning') or 'Sin razonamiento disponible.',
            }
        else:
            articles = cluster.get('articles') or []
            fallback_summary = ''
            if isinstance(articles, list) and articles and isinstance(articles[0], dict):
                fallback_summary = articles[0].get('snippet') or 'Sin análisis de IA disponible.'
            cluster['ai_analysis'] = {
                'suggestedTitle': cluster.get('title') or '',
                'summary': fallback_summary or 'Sin análisis de IA disponible.',
                'priority': 'DISCARD',
                'category': 'Otros',
                'reasoning': 'Ítem crudo (no analizado por IA o fuera de límite).',
            }
        merged.append(cluster)

    def _priority_weight(item):
        priority = ((item.get('ai_analysis') or {}).get('priority') or '').upper()
        if priority == 'P1':
            return 2000
        if priority == 'P2':
            return 1000
        return 0

    merged.sort(key=lambda item: _priority_weight(item) + (item.get('score') or 0), reverse=True)
    return jsonify({'results': merged, 'count': len(merged)})
