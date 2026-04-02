"""
Trends Provider Module
Abstrae la lógica de obtención de tendencias de diferentes proveedores (Google Internal, SerpApi, DataForSEO).
"""
import requests
import json
import random
import time
import base64
import logging
from typing import List, Dict, Any
from urllib.parse import quote_plus
import re
import xml.etree.ElementTree as ET

# Códigos de categoría para Google Trends Realtime (Internal / SerpApi)
GOOGLE_CAT_CODES = {
    'h': 'all', # General
    'b': 'b',   # Business
    'e': 'e',   # Entertainment
    'm': 'm',   # Health
    't': 't',   # Sci/Tech
    's': 's'    # Sports
}

# ISO 2 -> Country Name for DataForSEO (Basic Map)
ISO_TO_COUNTRY_NAME = {
    'ES': 'Spain',
    'US': 'United States',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'CO': 'Colombia',
    'CL': 'Chile',
    'PE': 'Peru',
    'GB': 'United Kingdom',
    'FR': 'France',
    'DE': 'Germany',
    'IT': 'Italy',
    'BR': 'Brazil'
}


CATEGORY_AFFINITY_TERMS = {
    'h': [],
    'b': ['negocio', 'negocios', 'economía', 'economia', 'mercado', 'mercados', 'empresa', 'empresas', 'finanzas', 'financiero', 'inversión', 'inversion', 'startup'],
    'e': ['cine', 'series', 'famosos', 'streaming', 'música', 'musica', 'celebridades', 'tv'],
    'm': ['salud', 'médico', 'medico', 'hospital', 'farmacia', 'bienestar', 'mental'],
    't': ['ia', 'ai', 'tecnología', 'tecnologia', 'software', 'app', 'apps', 'startup', 'gadgets', 'digital'],
    's': ['deportes', 'fútbol', 'futbol', 'liga', 'nba', 'nfl', 'tenis', 'motor']
}


def _normalize_text(value: str) -> str:
    return re.sub(r'[^a-z0-9áéíóúüñ ]+', ' ', (value or '').strip().lower())


def _tokenize_focus_terms(focus_terms: str) -> List[str]:
    if not focus_terms:
        return []

    raw_terms = re.split(r'[\n,;|]+', focus_terms)
    cleaned = []
    seen = set()
    for raw in raw_terms:
        term = _normalize_text(raw)
        term = re.sub(r'\s+', ' ', term).strip()
        if len(term) < 2 or term in seen:
            continue
        cleaned.append(term)
        seen.add(term)
    return cleaned


def _score_result(item: Dict[str, Any], category: str, focus_terms: List[str], ranking_mode: str) -> Dict[str, Any]:
    topic = item.get('topic', '')
    context = item.get('context', '')
    combined = _normalize_text(f"{topic} {context}")
    score = 0
    reasons = []
    matched_terms = []

    for term in focus_terms:
        if term and term in combined:
            term_score = 45 if term in _normalize_text(topic) else 28
            if len(term.split()) > 1:
                term_score += 10
            score += term_score
            matched_terms.append(term)
            reasons.append(f"Coincide con '{term}'")

    for affinity_term in CATEGORY_AFFINITY_TERMS.get(category, []):
        if affinity_term in combined:
            score += 12
            if f"Afinidad con {affinity_term}" not in reasons:
                reasons.append(f"Afinidad con {affinity_term}")

    if ranking_mode == 'strict' and focus_terms and not matched_terms:
        score -= 30
    elif ranking_mode == 'discovery' and not matched_terms:
        score += 8

    item['relevance_score'] = max(score, 0)
    item['matched_terms'] = matched_terms
    item['fit_label'] = 'Alta prioridad' if score >= 60 else 'Media' if score >= 25 else 'Exploratoria'
    item['opportunity_note'] = '; '.join(reasons[:3]) if reasons else 'Útil para vigilar cambios generales del mercado.'
    return item


def _prioritize_results(results: List[Dict[str, Any]], category: str, focus_terms: str = '', ranking_mode: str = 'balanced') -> List[Dict[str, Any]]:
    parsed_terms = _tokenize_focus_terms(focus_terms)
    enriched = [_score_result(dict(item), category, parsed_terms, ranking_mode) for item in results]

    if parsed_terms:
        enriched.sort(key=lambda item: (item.get('relevance_score', 0), item.get('rank', 0) * -1), reverse=True)
    else:
        enriched.sort(key=lambda item: item.get('rank', 0))

    for new_rank, item in enumerate(enriched, start=1):
        item['rank'] = new_rank
        item['google_link'] = f"https://google.com/search?q={quote_plus(item.get('topic', ''))}"
    return enriched


def _parse_google_news_rss(query: str, geo: str, language: str, limit: int = 20) -> List[Dict[str, Any]]:
    url = f"https://news.google.com/rss/search?q={quote_plus(query)}&hl={language}&gl={geo}&ceid={geo}:{language}"
    response = requests.get(url, timeout=20)
    if response.status_code != 200:
        raise Exception(f"Google News RSS Error {response.status_code}")

    root = ET.fromstring(response.content)
    items = root.findall('./channel/item')

    normalized: List[Dict[str, Any]] = []
    for index, item in enumerate(items[:limit], start=1):
        title = item.findtext('title') or ''
        link = item.findtext('link') or ''
        pub_date = item.findtext('pubDate') or ''
        source = item.find('{http://search.yahoo.com/mrss/}source')
        source_name = source.text if source is not None and source.text else 'Google News'
        description = item.findtext('description') or ''

        if not title or not link:
            continue

        normalized.append({
            'article_id': '',
            'title': title,
            'url': link,
            'source_name': source_name,
            'published_at': pub_date,
            'thumbnail_url': None,
            'position': index,
            'keyword': query,
            'snippet': description,
        })

    return normalized


def fetch_google_news(
    query: str,
    geo: str = 'US',
    language: str = 'en',
    provider_name: str = 'auto',
    limit: int = 20,
    **kwargs,
) -> List[Dict[str, Any]]:
    provider = (provider_name or 'auto').strip().lower()

    if provider == 'serpapi':
        api_key = kwargs.get('api_key')
        if not api_key:
            raise ValueError('API Key requerida para SerpApi')

        params = {
            'engine': 'google_news',
            'q': query,
            'api_key': api_key,
            'gl': geo.lower(),
            'hl': language,
            'num': limit,
        }
        response = requests.get('https://serpapi.com/search.json', params=params, timeout=20)
        data = response.json()
        if data.get('error'):
            raise Exception(data['error'])

        news_results = data.get('news_results', [])
        normalized: List[Dict[str, Any]] = []
        for index, item in enumerate(news_results, start=1):
            stories = item.get('stories') if isinstance(item.get('stories'), list) else []
            for story in stories:
                title = story.get('title')
                url = story.get('link')
                if not title or not url:
                    continue
                normalized.append({
                    'article_id': '',
                    'title': title,
                    'url': url,
                    'source_name': (story.get('source') or {}).get('name') if isinstance(story.get('source'), dict) else (story.get('source') or 'Desconocido'),
                    'published_at': story.get('date') or '',
                    'thumbnail_url': item.get('thumbnail'),
                    'position': index,
                    'keyword': query,
                    'snippet': item.get('snippet') or '',
                })

            title = item.get('title')
            url = item.get('link')
            if not title or not url:
                continue
            normalized.append({
                'article_id': '',
                'title': title,
                'url': url,
                'source_name': (item.get('source') or {}).get('name') if isinstance(item.get('source'), dict) else (item.get('source') or 'Desconocido'),
                'published_at': item.get('date') or '',
                'thumbnail_url': item.get('thumbnail'),
                'position': index,
                'keyword': query,
                'snippet': item.get('snippet') or '',
            })

        return normalized

    if provider == 'dataforseo':
        login = kwargs.get('login')
        password = kwargs.get('password')
        if not login or not password:
            raise ValueError('Credenciales DataForSEO requeridas')

        creds = base64.b64encode(f"{login}:{password}".encode('utf-8')).decode('utf-8')
        headers = {
            'Authorization': f'Basic {creds}',
            'Content-Type': 'application/json',
        }

        language_name = 'Spanish' if language == 'es' else 'English'
        location_name = ISO_TO_COUNTRY_NAME.get(geo.upper(), 'United States')

        payload = [{
            'keyword': query,
            'location_name': location_name,
            'language_name': language_name,
            'depth': min(max(limit, 1), 50),
        }]

        response = requests.post(
            'https://api.dataforseo.com/v3/serp/google/news/live/advanced',
            json=payload,
            headers=headers,
            timeout=30,
        )
        data = response.json()

        if data.get('status_code') != 20000:
            raise Exception(f"DataForSEO API Error: {data.get('status_message', 'Error desconocido')}")

        tasks = data.get('tasks', [])
        items = (((tasks[0] if tasks else {}).get('result') or [{}])[0]).get('items', [])

        normalized = []
        for index, item in enumerate(items[:limit], start=1):
            title = item.get('title')
            url = item.get('url')
            if not title or not url:
                continue
            normalized.append({
                'article_id': '',
                'title': title,
                'url': url,
                'source_name': item.get('source') or 'Desconocido',
                'published_at': item.get('timestamp') or '',
                'thumbnail_url': item.get('image_url'),
                'position': index,
                'keyword': query,
                'snippet': item.get('description') or '',
            })
        return normalized

    return _parse_google_news_rss(query=query, geo=geo.upper(), language=language, limit=limit)


def fetch_google_news_strategy(
    queries: List[str],
    geo: str = 'US',
    language: str = 'en',
    provider_name: str = 'auto',
    limit_per_query: int = 20,
    **kwargs,
) -> List[Dict[str, Any]]:
    all_items: List[Dict[str, Any]] = []
    for query in queries:
        sanitized_query = (query or '').strip()
        if not sanitized_query:
            continue
        all_items.extend(
            fetch_google_news(
                query=sanitized_query,
                geo=geo,
                language=language,
                provider_name=provider_name,
                limit=limit_per_query,
                **kwargs,
            )
        )
    return all_items

class TrendsProvider:
    """Clase base abstracta para proveedores de tendencias."""
    def fetch_trends(self, geo: str, category: str, **kwargs) -> List[Dict[str, Any]]:
        raise NotImplementedError

class GoogleInternalProvider(TrendsProvider):
    """Proveedor que usa la API interna (no oficial) de Google Trends."""

    def fetch_trends(self, geo: str, category: str, **kwargs) -> List[Dict[str, Any]]:
        focus_terms = kwargs.get('focus_terms', '')
        ranking_mode = kwargs.get('ranking_mode', 'balanced')
        cat_param = GOOGLE_CAT_CODES.get(category, 'all')
        # URL de Realtime
        url = f"https://trends.google.com/trends/api/realtimetrends?hl=es&tz=-60&cat={cat_param}&fi=0&fs=0&geo={geo}&ri=300&rs=20&sort=0"

        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        ]

        headers = {
            'User-Agent': random.choice(user_agents),
            'Accept': 'application/json, text/plain, */*',
            'Cookie': f'NID=511=OcQQ_uy; CONSENT=YES+ES.es+V14+BX; 1P_JAR={time.strftime("%Y")}-{time.strftime("%m-%d")}-01'
        }

        try:
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code != 200:
                raise Exception(f"Google Error {response.status_code}.")

            content = response.text

            prefix = ")]}' ,".replace(' ','')
            idx = content.find(prefix)
            if idx != -1:
                content = content[idx + len(prefix):]

            json_data = json.loads(content)

            stories = json_data.get('storySummaries', {}).get('trendingStories', [])
            if not stories: stories = json_data.get('trendingStories', [])

            if not stories:
                return []

            results = []
            rank_c = 1
            for story in stories:
                topic = story.get('title', 'Sin título')
                articles = story.get('articles', [])
                context = articles[0].get('articleTitle', '') if articles else ""
                source = articles[0].get('source', '') if articles else ""
                link = articles[0].get('url', f"https://www.google.com/search?q={topic}") if articles else ""

                results.append({
                    "rank": rank_c,
                    "topic": topic,
                    "traffic": source,
                    "context": context,
                    "google_link": link
                })
                rank_c += 1

            return _prioritize_results(results, category, focus_terms=focus_terms, ranking_mode=ranking_mode)

        except Exception as e:
            logging.error(f"GoogleInternalProvider Error: {e}")
            raise e

class SerpApiProvider(TrendsProvider):
    """Proveedor que usa SerpApi (Google Trends)."""

    def fetch_trends(self, geo: str, category: str, **kwargs) -> List[Dict[str, Any]]:
        api_key = kwargs.get('api_key')
        focus_terms = kwargs.get('focus_terms', '')
        ranking_mode = kwargs.get('ranking_mode', 'balanced')
        if not api_key:
            raise ValueError("API Key requerida para SerpApi")

        url = "https://serpapi.com/search"
        params = {
            "engine": "google_trends_trending_now",
            "frequency": "daily",
            "geo": geo,
            "api_key": api_key
        }

        try:
            resp = requests.get(url, params=params, timeout=15)
            data_json = resp.json()
            if "error" in data_json:
                raise Exception(data_json["error"])

            results = []
            for i, item in enumerate(data_json.get("daily_searches", [])):
                results.append({
                    "rank": i+1,
                    "topic": item.get('query', ''),
                    "traffic": item.get('formatted_traffic', 'N/A'),
                    "context": "API Externa",
                    "google_link": f"https://google.com/search?q={item.get('query','')}"
                })
            return _prioritize_results(results, category, focus_terms=focus_terms, ranking_mode=ranking_mode)
        except Exception as e:
            logging.error(f"SerpApiProvider Error: {e}")
            raise e

class DataForSEOProvider(TrendsProvider):
    def fetch_trends(self, geo: str, category: str, **kwargs) -> List[Dict[str, Any]]:
        login = kwargs.get('login')
        password = kwargs.get('password')
        focus_terms = kwargs.get('focus_terms', '')
        ranking_mode = kwargs.get('ranking_mode', 'balanced')

        if not login or not password:
             raise ValueError("Credenciales DataForSEO requeridas")

        url = "https://api.dataforseo.com/v3/dataforseo_labs/google/top_searches/live"

        location_name = ISO_TO_COUNTRY_NAME.get(geo, 'United States')
        language_code = "es" if geo in ['ES', 'MX', 'AR', 'CO', 'CL', 'PE'] else "en"

        creds = base64.b64encode(f"{login}:{password}".encode('utf-8')).decode('utf-8')
        headers = {
            "Authorization": f"Basic {creds}",
            "Content-Type": "application/json"
        }

        payload = [{
            "location_name": location_name,
            "language_name": "Spanish" if language_code == "es" else "English",
            "limit": 20
        }]

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            data = resp.json()

            if data.get('status_code') != 20000:
                msg = data.get('status_message', 'Error desconocido')
                raise Exception(f"DataForSEO API Error: {msg}")

            tasks = data.get('tasks', [])
            if not tasks or not tasks[0].get('result'):
                return []

            items = tasks[0]['result'][0].get('items', [])
            results = []
            rank = 1
            for item in items:
                keyword = item.get('keyword', '')
                vol = item.get('keyword_info', {}).get('search_volume', 0)

                results.append({
                    "rank": rank,
                    "topic": keyword,
                    "traffic": f"{vol} vol",
                    "context": "DataForSEO Top Search",
                    "google_link": f"https://google.com/search?q={keyword}"
                })
                rank += 1

            return _prioritize_results(results, category, focus_terms=focus_terms, ranking_mode=ranking_mode)

        except Exception as e:
            logging.error(f"DataForSEOProvider Error: {e}")
            raise e

def fetch_trends_strategy(geo: str, category: str, provider_name: str = 'dataforseo', **kwargs) -> List[Dict[str, Any]]:
    try:
        if provider_name == 'serpapi':
            return SerpApiProvider().fetch_trends(geo, category, **kwargs)
        elif provider_name == 'dataforseo':
            return DataForSEOProvider().fetch_trends(geo, category, **kwargs)
        elif provider_name == 'auto':
            if kwargs.get('login') and kwargs.get('password'):
                return DataForSEOProvider().fetch_trends(geo, category, **kwargs)
            return GoogleInternalProvider().fetch_trends(geo, category, **kwargs)
        else:
            return GoogleInternalProvider().fetch_trends(geo, category, **kwargs)
    except Exception as e:
        raise e
