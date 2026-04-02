# apps/trends_economy.py
"""
Módulo para el análisis de tendencias económicas y de búsqueda.
Integra DataForSEO para monitorizar temas virales en tiempo real.
Gestiona trabajos en segundo plano utilizando SQLite.
"""
from flask import Blueprint, request, jsonify, redirect, url_for
import threading
import logging
import json
import time
import sqlite3
import uuid
import os
import requests
from urllib.parse import urljoin

from apps.web.blueprints.trends_provider import fetch_trends_strategy
from apps.core.database import get_user_settings
from apps.tools.credentials import (
    MISSING_DFS_CREDENTIALS_MESSAGE,
    resolve_dataforseo_credentials,
)

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



def _json_with_trace(payload, status=200, request_id=None):
    rid = request_id or str(uuid.uuid4())
    merged = {
        **payload,
        'requestId': payload.get('requestId') or rid,
        'traceId': payload.get('traceId') or rid,
    }
    response = jsonify(merged)
    response.status_code = status
    response.headers['X-Request-Id'] = merged['requestId']
    response.headers['X-Trace-Id'] = merged['traceId']
    return response


def _resolve_news_provider(provider=None):
    explicit = (provider or '').strip().lower()
    if explicit in ('serpapi', 'dataforseo'):
        return explicit

    settings = get_user_settings('default') or {}
    configured = (settings.get('serp_provider') or os.getenv('SERP_PROVIDER') or 'dataforseo').strip().lower()
    return configured if configured in ('serpapi', 'dataforseo') else 'dataforseo'


def _fetch_news_serpapi(query, max_results, language, country):
    api_key = (os.getenv('SERPAPI_KEY') or '').strip()
    if not api_key:
        raise ValueError('Falta SERPAPI_KEY en backend.')

    response = requests.get(
        'https://serpapi.com/search.json',
        params={
            'engine': 'google_news',
            'q': query,
            'api_key': api_key,
            'hl': language,
            'gl': country,
            'num': max_results,
        },
        timeout=20,
    )
    response.raise_for_status()
    data = response.json()

    rows = []
    for index, item in enumerate(data.get('news_results') or [], start=1):
        rows.append({
            'title': item.get('title', ''),
            'url': item.get('link', ''),
            'sourceName': (item.get('source') or {}).get('name') if isinstance(item.get('source'), dict) else (item.get('source') or 'Desconocido'),
            'publishedAt': item.get('date') or '',
            'thumbnailUrl': item.get('thumbnail'),
            'position': index,
            'keyword': query,
            'snippet': item.get('snippet') or '',
        })
    return rows


def _fetch_news_dataforseo(query, max_results, language, country):
    credentials = resolve_dataforseo_credentials({})
    if not credentials.get('login') or not credentials.get('password'):
        raise ValueError(MISSING_DFS_CREDENTIALS_MESSAGE)

    payload = [{
        'keyword': query,
        'language_code': language,
        'location_code': 2724 if country.lower() == 'es' else 2840,
        'depth': max_results,
    }]
    response = requests.post(
        'https://api.dataforseo.com/v3/serp/google/news/live/advanced',
        auth=(credentials['login'], credentials['password']),
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()

    rows = []
    tasks = data.get('tasks') or []
    for task in tasks:
        for result in task.get('result') or []:
            for index, item in enumerate(result.get('items') or [], start=1):
                rows.append({
                    'title': item.get('title', ''),
                    'url': item.get('url', ''),
                    'sourceName': item.get('source') or 'Desconocido',
                    'publishedAt': item.get('timestamp') or '',
                    'thumbnailUrl': item.get('thumbnail'),
                    'position': index,
                    'keyword': query,
                    'snippet': item.get('description') or '',
                })
    return rows


@trends_bp.route('/trends/media/news', methods=['POST'])
@trends_bp.route('/api/trends/media/news', methods=['POST'])
def trends_media_news():
    request_id = str(uuid.uuid4())
    body = request.get_json(silent=True) or {}
    queries = body.get('queries') or []

    if not isinstance(queries, list) or not queries:
        return _json_with_trace({'code': 'BAD_REQUEST', 'message': 'queries es obligatorio.'}, status=400, request_id=request_id)

    normalized_queries = [str(q).strip() for q in queries if str(q).strip()]
    if not normalized_queries:
        return _json_with_trace({'code': 'BAD_REQUEST', 'message': 'queries no puede estar vacío.'}, status=400, request_id=request_id)

    provider = _resolve_news_provider(body.get('provider'))
    language = (body.get('language') or 'es').strip().lower()
    country = (body.get('country') or 'es').strip().lower()
    max_results = int(body.get('maxResults') or 20)
    max_results = max(1, min(max_results, 100))

    items = []
    try:
        for query in normalized_queries:
            if provider == 'serpapi':
                items.extend(_fetch_news_serpapi(query, max_results, language, country))
            else:
                items.extend(_fetch_news_dataforseo(query, max_results, language, country))
    except ValueError as exc:
        return _json_with_trace({'code': 'CONFIG_ERROR', 'message': str(exc)}, status=400, request_id=request_id)
    except requests.RequestException as exc:
        logging.exception('Trends media provider request failed')
        return _json_with_trace({'code': 'PROVIDER_ERROR', 'message': f'Error consultando proveedor: {exc}'}, status=502, request_id=request_id)
    except Exception as exc:
        logging.exception('Unexpected error in trends media news endpoint')
        return _json_with_trace({'code': 'INTERNAL_ERROR', 'message': str(exc)}, status=500, request_id=request_id)

    return _json_with_trace({'items': items, 'provider': provider}, status=200, request_id=request_id)
