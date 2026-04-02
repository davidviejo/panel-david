# apps/trends_economy.py
"""
Módulo para el análisis de tendencias económicas y de búsqueda.
Integra DataForSEO para monitorizar temas virales en tiempo real.
Gestiona trabajos en segundo plano utilizando SQLite.
"""
from flask import Blueprint, request, jsonify, redirect, url_for, session, make_response
import threading
import logging
import json
import time
import sqlite3
import uuid
import os
import requests
from urllib.parse import urljoin
from typing import Any, Dict, List

from apps.web.blueprints.trends_provider import fetch_trends_strategy
from apps.tools.credentials import (
    MISSING_DFS_CREDENTIALS_MESSAGE,
    resolve_dataforseo_credentials,
)
from apps.core.database import get_user_settings

trends_bp = Blueprint('trends_bp', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, '..', '..', '..', 'data', 'trends_jobs.db')
_DB_INITIALIZED = False


def resolve_trends_media_frontend_url() -> str:
    """
    Resuelve la URL canónica del módulo Trends Media ya migrado al frontend React.

    Prioridad:
    1. `MEDIAFLOW_FRONTEND_URL`, para entornos donde frontend y backend corren en hosts/puertos distintos.
    2. Misma origin con HashRouter (`/#/app/trends-media`) cuando se sirve todo bajo el mismo dominio.
    """
    configured_base = (os.getenv('MEDIAFLOW_FRONTEND_URL') or '').strip().rstrip('/')
    hash_route = '/#/app/trends-media'

    if configured_base:
        return urljoin(f'{configured_base}/', hash_route.lstrip('/'))

    return hash_route


def _resolve_trace_id() -> str:
    trace_id = request.headers.get('x-trace-id') or request.headers.get('x-request-id')
    if trace_id and trace_id.strip():
        return trace_id.strip()
    return str(uuid.uuid4())


def _trends_error_response(message: str, status_code: int, *, code: str = ''):
    trace_id = _resolve_trace_id()
    payload = {
        'code': code or f'HTTP_{status_code}',
        'error': message,
        'traceId': trace_id,
        'requestId': trace_id,
    }
    response = make_response(jsonify(payload), status_code)
    response.headers['x-trace-id'] = trace_id
    response.headers['x-request-id'] = trace_id
    return response


def _resolve_serpapi_key() -> str:
    key = (session.get('serpapi_key') or '').strip()
    if key:
        return key

    settings = get_user_settings('default') or {}
    key = (settings.get('serpapi_key') or '').strip()
    if key:
        return key

    return (os.getenv('SERPAPI_KEY') or '').strip()


def _normalize_serpapi_news_response(data: Dict[str, Any], keyword: str) -> List[Dict[str, Any]]:
    items = data.get('news_results') or []
    normalized: List[Dict[str, Any]] = []

    for index, item in enumerate(items):
        for story in item.get('stories') or []:
            normalized.append({
                'id': '',
                'title': story.get('title') or '',
                'url': story.get('link') or '',
                'source': (story.get('source') or {}).get('name') if isinstance(story.get('source'), dict) else (story.get('source') or 'Desconocido'),
                'publishedAt': story.get('date') or '',
                'thumbnailUrl': item.get('thumbnail'),
                'position': index + 1,
                'keyword': keyword,
                'snippet': item.get('snippet') or '',
            })

        normalized.append({
            'id': '',
            'title': item.get('title') or '',
            'url': item.get('link') or '',
            'source': (item.get('source') or {}).get('name') if isinstance(item.get('source'), dict) else (item.get('source') or 'Desconocido'),
            'publishedAt': item.get('date') or '',
            'thumbnailUrl': item.get('thumbnail'),
            'position': index + 1,
            'keyword': keyword,
            'snippet': item.get('snippet') or '',
        })

    return [article for article in normalized if article['title'] and article['url']]


def _fetch_serpapi_news(queries: List[str], country: str, language: str, max_results: int) -> List[Dict[str, Any]]:
    api_key = _resolve_serpapi_key()
    if not api_key:
        raise ValueError('SERPAPI_KEY_MISSING')

    articles: List[Dict[str, Any]] = []
    for query in queries:
        params = {
            'engine': 'google_news',
            'q': query,
            'api_key': api_key,
            'gl': country,
            'hl': language,
            'num': max_results,
        }

        response = requests.get('https://serpapi.com/search.json', params=params, timeout=25)
        payload = response.json()

        if not response.ok:
            raise RuntimeError(payload.get('error') or f'SerpApi HTTP {response.status_code}')
        if payload.get('error'):
            raise RuntimeError(str(payload['error']))

        articles.extend(_normalize_serpapi_news_response(payload, query))

    return articles

def init_db():
    """
    Inicializa la base de datos SQLite para el seguimiento de trabajos.
    Crea la tabla 'jobs' si no existe.
    """
    global _DB_INITIALIZED
    if _DB_INITIALIZED:
        return
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS jobs
                     (job_id TEXT PRIMARY KEY, active INTEGER, progress INTEGER, log TEXT, data TEXT, error TEXT, created_at REAL)''')
        conn.commit()
        conn.close()
        _DB_INITIALIZED = True
    except Exception as e:
        logging.error(f"Error initiating DB: {e}")


def get_job_status(job_id):
    init_db()
    """
    Recupera el estado actual de un trabajo por su ID.

    Args:
        job_id (str): Identificador único del trabajo.

    Returns:
        dict: Diccionario con el estado, progreso y datos del trabajo, o None si no existe.
    """
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
        row = c.fetchone()
        conn.close()

        if row:
            return {
                "active": bool(row['active']),
                "progress": row['progress'],
                "log": json.loads(row['log']),
                "data": json.loads(row['data']),
                "error": row['error']
            }
        return None
    except Exception:
        return None

def update_job_status(job_id, updates, conn=None):
    """
    Actualiza el estado de un trabajo en la base de datos.

    Args:
        job_id (str): Identificador del trabajo.
        updates (dict): Diccionario con los campos a actualizar (active, progress, log_append, data, error).
        conn (sqlite3.Connection, optional): Conexión existente a la base de datos. Si se proporciona, no se cierra al finalizar.
    """
    init_db()
    should_close = False
    try:
        if conn is None:
            conn = sqlite3.connect(DB_FILE)
            should_close = True

        c = conn.cursor()

        c.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
        row = c.fetchone()
        if not row:
            if should_close:
                conn.close()
            return

        current_log = json.loads(row[3])
        if 'log_append' in updates:
            current_log.append(updates['log_append'])

        new_active = updates.get('active', row[1])
        new_progress = updates.get('progress', row[2])
        new_data = json.dumps(updates.get('data')) if 'data' in updates else row[4]
        new_error = updates.get('error', row[5])

        c.execute('''UPDATE jobs SET active=?, progress=?, log=?, data=?, error=? WHERE job_id=?''',
                  (new_active, new_progress, json.dumps(current_log), new_data, new_error, job_id))

        conn.commit()
        if should_close:
            conn.close()
    except Exception as e:
        logging.error(f"Error updating job: {e}")
        if should_close and conn:
            try:
                conn.close()
            except Exception:
                pass

def worker_realtime_trends(job_id, geo, category, focus_terms='', ranking_mode='balanced', credentials_override=None):
    """
    Worker en segundo plano para procesar tendencias usando DataForSEO.

    Args:
        job_id (str): ID del trabajo.
        geo (str): Geolocalización.
        category (str): Categoría de búsqueda.
        credentials_override (dict, optional): Override explícito de credenciales.
    """
    init_db()
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)

        update_job_status(job_id, {'active': 1, 'progress': 10, 'log_append': f"🚀 Analizando {geo}..."}, conn=conn)

        geo = geo.strip().upper()

        provider = 'dataforseo'
        credentials = resolve_dataforseo_credentials(credentials_override or {})

        if not credentials['login'] or not credentials['password']:
            raise ValueError(MISSING_DFS_CREDENTIALS_MESSAGE)

        update_job_status(job_id, {'log_append': "🛠️ Usando DataForSEO API..."}, conn=conn)

        # Ejecutar estrategia
        update_job_status(job_id, {'progress': 50}, conn=conn)

        update_job_status(job_id, {'log_append': f"🎯 Priorizando por temas: {focus_terms[:120]}" if focus_terms else "🧭 Modo exploración general activo."}, conn=conn)

        results = fetch_trends_strategy(geo, category, provider_name=provider, focus_terms=focus_terms, ranking_mode=ranking_mode, **credentials)

        if not results:
             raise Exception("No se encontraron tendencias.")

        update_job_status(job_id, {
            'data': results,
            'progress': 100,
            'log_append': f"✅ Éxito: {len(results)} tendencias."
        }, conn=conn)

    except Exception as e:
        logging.error(f"Trends Worker Error: {e}")
        update_job_status(job_id, {
            'error': str(e),
            'log_append': f"❌ Error: {str(e)}"
        }, conn=conn)
    finally:
        update_job_status(job_id, {'active': 0}, conn=conn)
        if conn:
            try:
                conn.close()
            except Exception:
                pass

@trends_bp.route('/trends/dashboard')
def dashboard():
    return redirect(url_for('trends_bp.trends_media_app'))

@trends_bp.route('/trends/media')
def trends_media_app():
    return redirect(resolve_trends_media_frontend_url())

@trends_bp.route('/trends/media/<path:asset_path>')
def trends_media_assets(asset_path):
    return redirect(resolve_trends_media_frontend_url())

@trends_bp.route('/trends/start', methods=['POST'])
@trends_bp.route('/trends/start_realtime', methods=['POST'])
def start_analysis():
    init_db()
    job_id = str(uuid.uuid4())
    geo = request.form.get('geo', 'ES')
    category = request.form.get('category', 'h')
    focus_terms = request.form.get('focus_terms', '').strip()
    ranking_mode = request.form.get('ranking_mode', 'balanced').strip() or 'balanced'
    credentials_override = {
        'dataforseo_login': request.form.get('dataforseo_login', '').strip(),
        'dataforseo_password': request.form.get('dataforseo_password', '').strip()
    }
    resolved_credentials = resolve_dataforseo_credentials(credentials_override)
    if not resolved_credentials.get('login') or not resolved_credentials.get('password'):
        return jsonify({"status": "error", "message": MISSING_DFS_CREDENTIALS_MESSAGE}), 400

    # Create initial job record
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO jobs (job_id, active, progress, log, data, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
              (job_id, 1, 0, json.dumps(["🚀 Iniciando..."]), json.dumps([]), None, time.time()))
    conn.commit()
    conn.close()

    t = threading.Thread(target=worker_realtime_trends, args=(job_id, geo, category, focus_terms, ranking_mode, credentials_override))
    t.start()

    return jsonify({"status": "started", "job_id": job_id})

@trends_bp.route('/trends/status')
def get_status():
    job_id = request.args.get('job_id')
    if not job_id:
        return jsonify({"error": "No job_id provided"}), 400

    status = get_job_status(job_id)
    if status:
        return jsonify(status)
    else:
        return jsonify({"error": "Job not found"}), 404


@trends_bp.route('/trends/media/news', methods=['POST'])
def trends_media_news():
    body = request.get_json(silent=True) or {}
    queries = [str(item).strip() for item in body.get('queries', []) if str(item).strip()]
    if not queries:
        return _trends_error_response('Debes enviar al menos una query en `queries`.', 400, code='TRENDS_NEWS_INVALID_QUERY')

    provider = str(body.get('provider') or os.getenv('TRENDS_NEWS_PROVIDER') or 'serpapi').strip().lower()
    country = str(body.get('country') or 'es').strip().lower()
    language = str(body.get('language') or 'es').strip().lower()
    max_results = int(body.get('maxResults') or 100)
    max_results = max(1, min(max_results, 100))

    try:
        if provider in ('auto', 'serpapi'):
            articles = _fetch_serpapi_news(queries, country, language, max_results)
            response = jsonify({'articles': articles, 'providerUsed': 'serpapi'})
            trace_id = _resolve_trace_id()
            response.headers['x-trace-id'] = trace_id
            response.headers['x-request-id'] = trace_id
            return response

        if provider == 'dataforseo':
            return _trends_error_response(
                'Provider DataForSEO para news en Trends Media no está habilitado en este endpoint. Usa `serpapi`.',
                400,
                code='TRENDS_NEWS_PROVIDER_UNSUPPORTED',
            )

        return _trends_error_response(
            f'Provider no soportado: {provider}',
            400,
            code='TRENDS_NEWS_PROVIDER_INVALID',
        )
    except ValueError as error:
        if str(error) == 'SERPAPI_KEY_MISSING':
            return _trends_error_response(
                'Falta configurar la clave de SerpApi en backend para Trends Media.',
                400,
                code='TRENDS_NEWS_SERPAPI_KEY_MISSING',
            )
        return _trends_error_response(str(error), 400, code='TRENDS_NEWS_BAD_REQUEST')
    except requests.RequestException as error:
        logging.error("trends_media_news network_error=%s", error)
        return _trends_error_response('Error de red consultando proveedor de noticias.', 502, code='TRENDS_NEWS_UPSTREAM_NETWORK')
    except Exception as error:
        logging.error("trends_media_news unexpected_error=%s", error)
        return _trends_error_response('Error inesperado obteniendo noticias de Trends Media.', 502, code='TRENDS_NEWS_UPSTREAM_FAILED')
