import os
from flask import jsonify, request, current_app
from datetime import datetime
from apps.tools.utils import safe_get_json, clean_url, is_safe_url
from apps.core.database import get_user_settings
from . import api_engine_bp
from .seo_checklist_orchestrator import run_orchestrated_checklist

@api_engine_bp.route('/api/analyze', methods=['POST'])
def analyze():
    data = safe_get_json()
    url = clean_url(data.get('url'))
    kw = data.get('kwPrincipal', '')
    p_type = data.get('pageType', 'Otro')
    geo = data.get('geoTarget', '')
    cluster = data.get('cluster', '')
    page_id = data.get('pageId', '')
    gsc_queries = data.get('gscQueries', [])

    # New optional parameters for deep analysis
    # Maintain backward compatibility with old top-level params if analysisConfig is missing
    analysis_config = data.get('analysisConfig')

    # Legacy fallbacks
    analyze_competitors = data.get('analyzeCompetitors', False)
    competitor_urls = data.get('competitorUrls', [])
    serp_api_confirmed = data.get('serpApiConfirmed', False)
    serp_provider = data.get('serpProvider')

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    if not is_safe_url(url):
        return jsonify({'error': 'Invalid or unsafe URL'}), 400

    # Execute analysis
    result = run_orchestrated_checklist(
        url, kw, p_type, geo, cluster, gsc_queries,
        analyze_competitors=analyze_competitors,
        competitor_urls=competitor_urls,
        serp_api_confirmed=serp_api_confirmed,
        serp_provider=serp_provider,
        analysis_config=analysis_config
    )

    # Wrap with metadata
    response = {
        "pageId": page_id,
        "url": url,
        "generatedAt": datetime.utcnow().isoformat(),
        "items": result
    }

    # Add advanced execution status if available in result
    if 'advancedExecuted' in result:
        response['advancedExecuted'] = result['advancedExecuted']
    if 'advancedBlockedReason' in result:
        response['advancedBlockedReason'] = result['advancedBlockedReason']

    # Add applied limits and provider info
    if 'appliedLimits' in result:
        response['appliedLimits'] = result['appliedLimits']
    if 'providerUsed' in result:
        response['providerUsed'] = result['providerUsed']

    return jsonify(response)

@api_engine_bp.route('/api/capabilities', methods=['GET'])
def capabilities():
    """
    Returns available providers and server hard limits.
    """
    settings = get_user_settings()

    # Check availability (Env vars take precedence or combine with settings)
    has_serpapi = bool(settings.get('serpapi_key') or os.environ.get('SERPAPI_KEY'))
    has_dfs = bool((settings.get('dataforseo_login') and settings.get('dataforseo_password')) or
                   (os.environ.get('DATAFORSEO_LOGIN') and os.environ.get('DATAFORSEO_PASSWORD')))

    serp_providers = {
        "serpapi": has_serpapi,
        "dataforseo": has_dfs,
        "internal": True
    }

    # Hard limits from Config
    max_kw = current_app.config.get('ENGINE_MAX_KEYWORDS_PER_URL', 20)
    max_comp = current_app.config.get('ENGINE_MAX_COMPETITORS_PER_KEYWORD', 5)
    max_urls = current_app.config.get('ENGINE_MAX_URLS_PER_BATCH', 100)

    limits = {
        "maxKeywordsPerUrl": max_kw,
        "maxCompetitorsPerKeyword": max_comp,
        "maxUrlsPerBatch": max_urls
    }

    cost_model = {
        "serpapi": {"unit": "query", "estimatedCostPerQuery": 0.01},
        "dataforseo": {"unit": "query", "estimatedCostPerQuery": 0.02},
        "internal": {"unit": "query", "estimatedCostPerQuery": 0.0}
    }

    return jsonify({
        "serpProviders": serp_providers,
        "limits": limits,
        "costModel": cost_model
    })
