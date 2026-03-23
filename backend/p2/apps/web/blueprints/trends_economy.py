# apps/trends_economy.py
"""
Módulo para el análisis de tendencias económicas y de búsqueda.
Integra DataForSEO para monitorizar temas virales en tiempo real.
Gestiona trabajos en segundo plano utilizando SQLite.
"""
from flask import Blueprint, request, jsonify, redirect, send_from_directory, url_for
import threading
import logging
import json
import time
import sqlite3
import uuid
import os
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

from apps.web.blueprints.trends_provider import fetch_trends_strategy, _prioritize_results
from apps.core.database import get_user_settings

trends_bp = Blueprint('trends_bp', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, '..', '..', '..', 'data', 'trends_jobs.db')
TRENDS_MEDIA_DIST_DIR = os.path.join(BASE_DIR, '..', '..', '..', 'static', 'trends_media')

_DB_INITIALIZED = False


def init_db():
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

        c.execute(
            '''UPDATE jobs SET active=?, progress=?, log=?, data=?, error=? WHERE job_id=?''',
            (new_active, new_progress, json.dumps(current_log), new_data, new_error, job_id),
        )

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


def _parse_multiline(value):
    if not value:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [line.strip() for line in str(value).splitlines() if line.strip()]


def _time_window_to_hours(window_value):
    mapping = {'24h': 24, '48h': 48, '7d': 24 * 7}
    return mapping.get((window_value or '24h').strip(), 24)


def _is_ignored(url, ignored_domains):
    hostname = (urlparse(url).hostname or '').lower()
    return any(domain.lower() in hostname for domain in ignored_domains)


def _is_recent(pub_date, max_age_hours):
    if not pub_date:
        return True
    try:
        parsed = parsedate_to_datetime(pub_date)
        age_seconds = time.time() - parsed.timestamp()
        return age_seconds <= max_age_hours * 3600
    except Exception:
        return True


def _fetch_rss_items(feed_urls, ignored_domains, max_age_hours):
    results = []
    rank = 1
    for feed_url in feed_urls:
        try:
            response = requests.get(feed_url, timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
            response.raise_for_status()
            root = ET.fromstring(response.text)
            items = root.findall('.//item')[:12]
            if not items:
                items = root.findall('.//{http://www.w3.org/2005/Atom}entry')[:12]
            for item in items:
                title = (item.findtext('title') or item.findtext('{http://www.w3.org/2005/Atom}title') or '').strip()
                link = (item.findtext('link') or item.findtext('{http://www.w3.org/2005/Atom}link') or '').strip()
                if not link:
                    link_tag = item.find('{http://www.w3.org/2005/Atom}link')
                    if link_tag is not None:
                        link = link_tag.attrib.get('href', '')
                description = (item.findtext('description') or item.findtext('{http://www.w3.org/2005/Atom}summary') or '').strip()
                pub_date = (item.findtext('pubDate') or item.findtext('{http://www.w3.org/2005/Atom}updated') or '').strip()
                if not title or not link or _is_ignored(link, ignored_domains) or not _is_recent(pub_date, max_age_hours):
                    continue
                hostname = urlparse(link).hostname or urlparse(feed_url).hostname or 'RSS'
                results.append({
                    'rank': rank,
                    'topic': title,
                    'traffic': hostname.replace('www.', ''),
                    'context': BeautifulSoup(description, 'html.parser').get_text(' ', strip=True)[:280] or f'Extraído desde feed RSS {feed_url}',
                    'google_link': link,
                    'source_type': 'rss',
                    'source_url': link,
                })
                rank += 1
        except Exception as exc:
            logging.warning(f'RSS fetch error for {feed_url}: {exc}')
    return results


def _fetch_html_items(urls, ignored_domains):
    results = []
    rank = 1
    for page_url in urls:
        try:
            response = requests.get(page_url, timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            hostname = (urlparse(page_url).hostname or '').replace('www.', '') or 'HTML'
            seen_links = set()
            for link in soup.select('a[href]'):
                href = link.get('href', '').strip()
                text = link.get_text(' ', strip=True)
                if not href or not text or len(text) < 18:
                    continue
                if href.startswith('/'):
                    href = page_url.rstrip('/') + href
                if href in seen_links or _is_ignored(href, ignored_domains):
                    continue
                seen_links.add(href)
                results.append({
                    'rank': rank,
                    'topic': text[:160],
                    'traffic': hostname,
                    'context': f'Encontrado mediante rastreo HTML en {page_url}',
                    'google_link': href,
                    'source_type': 'html',
                    'source_url': href,
                })
                rank += 1
                if rank > 12:
                    break
        except Exception as exc:
            logging.warning(f'HTML scrape error for {page_url}: {exc}')
    return results


def _build_demo_results():
    return [
        {
            'rank': 1,
            'topic': 'Noticias Valencia: inversión industrial y empleo en Sagunto',
            'traffic': 'Demo 12k',
            'context': 'Dato simulado para validar el flujo editorial, priorización y brief.',
            'google_link': 'https://google.com/search?q=noticias+valencia+inversion+industrial',
            'source_type': 'demo',
            'source_url': 'https://google.com/search?q=noticias+valencia+inversion+industrial',
        },
        {
            'rank': 2,
            'topic': 'Noticias General: audiencia, streaming y publicidad digital',
            'traffic': 'Demo 8k',
            'context': 'Tema simulado orientado a medios, consumo de contenido y monetización.',
            'google_link': 'https://google.com/search?q=audiencia+streaming+publicidad+digital',
            'source_type': 'demo',
            'source_url': 'https://google.com/search?q=audiencia+streaming+publicidad+digital',
        },
        {
            'rank': 3,
            'topic': 'Turismo y eventos en Comunidad Valenciana',
            'traffic': 'Demo 5k',
            'context': 'Escenario demo con impacto regional para validación de la interfaz.',
            'google_link': 'https://google.com/search?q=turismo+eventos+comunidad+valenciana',
            'source_type': 'demo',
            'source_url': 'https://google.com/search?q=turismo+eventos+comunidad+valenciana',
        },
    ]


def _dedupe_results(results):
    deduped = []
    seen = set()
    for item in results:
        key = (item.get('topic', '').strip().lower(), item.get('google_link', '').strip().lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    for rank, item in enumerate(deduped, start=1):
        item['rank'] = rank
    return deduped


def worker_realtime_trends(job_id, geo, category, focus_terms='', ranking_mode='balanced', dataforseo_login=None, dataforseo_password=None, search_mode='demo', serp_provider='serpapi', serp_api_key='', rss_feeds=None, html_urls=None, ignored_domains=None, time_window='24h'):
    init_db()
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)
        update_job_status(job_id, {'active': 1, 'progress': 10, 'log_append': f"🚀 Analizando {geo}..."}, conn=conn)

        geo = geo.strip().upper()
        settings = get_user_settings('default')
        ignored_domains = ignored_domains or []
        rss_feeds = rss_feeds or []
        html_urls = html_urls or []
        max_age_hours = _time_window_to_hours(time_window)
        collected_results = []

        if search_mode == 'demo':
            update_job_status(job_id, {'log_append': '🧪 Modo demo activado.'}, conn=conn)
            collected_results.extend(_build_demo_results())
        else:
            update_job_status(job_id, {'log_append': '📰 Extrayendo feeds RSS configurados...'}, conn=conn)
            collected_results.extend(_fetch_rss_items(rss_feeds, ignored_domains, max_age_hours))
            update_job_status(job_id, {'progress': 30, 'log_append': '🕸️ Rastreando URLs HTML configuradas...'}, conn=conn)
            collected_results.extend(_fetch_html_items(html_urls, ignored_domains))

            if search_mode == 'pro':
                update_job_status(job_id, {'progress': 55, 'log_append': f'🔎 Consultando proveedor {serp_provider}...'}, conn=conn)
                if serp_provider == 'dataforseo':
                    credentials = {
                        'login': (dataforseo_login or '').strip() or os.getenv('DATAFORSEO_LOGIN') or settings.get('dataforseo_login'),
                        'password': (dataforseo_password or '').strip() or os.getenv('DATAFORSEO_PASSWORD') or settings.get('dataforseo_password'),
                    }
                    provider_results = fetch_trends_strategy(geo, category, provider_name='dataforseo', focus_terms=focus_terms, ranking_mode=ranking_mode, **credentials)
                    for item in provider_results:
                        item['source_type'] = 'dataforseo'
                        item['source_url'] = item.get('google_link')
                    collected_results.extend(provider_results)
                else:
                    provider_results = fetch_trends_strategy(geo, category, provider_name='serpapi', api_key=serp_api_key, focus_terms=focus_terms, ranking_mode=ranking_mode)
                    for item in provider_results:
                        item['source_type'] = 'serp'
                        item['source_url'] = item.get('google_link')
                    collected_results.extend(provider_results)
            else:
                update_job_status(job_id, {'progress': 55, 'log_append': '🌐 Modo gratuito: usando RSS + scraping directo.'}, conn=conn)

        update_job_status(job_id, {'progress': 75, 'log_append': '🧠 Priorizando resultados...'}, conn=conn)
        prioritized = _prioritize_results(_dedupe_results(collected_results), category, focus_terms=focus_terms, ranking_mode=ranking_mode)

        if not prioritized:
            raise Exception('No se encontraron tendencias o noticias útiles con la configuración actual.')

        update_job_status(job_id, {'data': prioritized, 'progress': 100, 'log_append': f"✅ Éxito: {len(prioritized)} resultados."}, conn=conn)
    except Exception as e:
        logging.error(f"Trends Worker Error: {e}")
        update_job_status(job_id, {'error': str(e), 'log_append': f"❌ Error: {str(e)}"}, conn=conn)
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
    return send_from_directory(TRENDS_MEDIA_DIST_DIR, 'index.html')


@trends_bp.route('/trends/media/<path:asset_path>')
def trends_media_assets(asset_path):
    return send_from_directory(TRENDS_MEDIA_DIST_DIR, asset_path)


@trends_bp.route('/trends/start', methods=['POST'])
def start_analysis():
    init_db()
    job_id = str(uuid.uuid4())
    geo = request.form.get('geo', 'ES')
    category = request.form.get('category', 'h')
    focus_terms = request.form.get('focus_terms', '').strip()
    ranking_mode = request.form.get('ranking_mode', 'balanced').strip() or 'balanced'
    dataforseo_login = request.form.get('dataforseo_login', '').strip()
    dataforseo_password = request.form.get('dataforseo_password', '').strip()
    search_mode = request.form.get('search_mode', 'demo').strip() or 'demo'
    serp_provider = request.form.get('serp_provider', 'serpapi').strip() or 'serpapi'
    serp_api_key = request.form.get('serp_api_key', '').strip()
    rss_feeds = _parse_multiline(request.form.get('rss_feeds', ''))
    html_urls = _parse_multiline(request.form.get('html_urls', ''))
    ignored_domains = _parse_multiline(request.form.get('ignored_domains', ''))
    time_window = request.form.get('time_window', '24h').strip() or '24h'

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        "INSERT INTO jobs (job_id, active, progress, log, data, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (job_id, 1, 0, json.dumps(["🚀 Iniciando..."]), json.dumps([]), None, time.time()),
    )
    conn.commit()
    conn.close()

    t = threading.Thread(
        target=worker_realtime_trends,
        args=(
            job_id,
            geo,
            category,
            focus_terms,
            ranking_mode,
            dataforseo_login,
            dataforseo_password,
            search_mode,
            serp_provider,
            serp_api_key,
            rss_feeds,
            html_urls,
            ignored_domains,
            time_window,
        ),
    )
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
    return jsonify({"error": "Job not found"}), 404
