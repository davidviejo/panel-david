# apps/trends_economy.py
"""
Módulo para el análisis de tendencias económicas y de búsqueda.
Integra DataForSEO para monitorizar temas virales en tiempo real.
Gestiona trabajos en segundo plano utilizando SQLite.
"""
from flask import Blueprint, render_template, request, jsonify
import threading
import logging
import json
import time
import sqlite3
import uuid
import os

from apps.web.blueprints.trends_provider import fetch_trends_strategy
from apps.core.database import get_user_settings

trends_bp = Blueprint('trends_bp', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, '..', '..', '..', 'data', 'trends_jobs.db')

_DB_INITIALIZED = False

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

def worker_realtime_trends(job_id, geo, category, dataforseo_login=None, dataforseo_password=None):
    """
    Worker en segundo plano para procesar tendencias usando DataForSEO.

    Args:
        job_id (str): ID del trabajo.
        geo (str): Geolocalización.
        category (str): Categoría de búsqueda.
        dataforseo_login (str, optional): Login DataForSEO desde UI.
        dataforseo_password (str, optional): Password DataForSEO desde UI.
    """
    init_db()
    conn = None
    try:
        conn = sqlite3.connect(DB_FILE)

        update_job_status(job_id, {'active': 1, 'progress': 10, 'log_append': f"🚀 Analizando {geo}..."}, conn=conn)

        geo = geo.strip().upper()

        settings = get_user_settings('default')
        provider = 'dataforseo'
        credentials = {
            'login': (dataforseo_login or '').strip() or os.getenv('DATAFORSEO_LOGIN') or settings.get('dataforseo_login'),
            'password': (dataforseo_password or '').strip() or os.getenv('DATAFORSEO_PASSWORD') or settings.get('dataforseo_password')
        }

        if not credentials['login'] or not credentials['password']:
            raise ValueError('Faltan las credenciales de DataForSEO. Configúralas en Settings o introdúcelas en el formulario.')

        update_job_status(job_id, {'log_append': "🛠️ Usando DataForSEO API..."}, conn=conn)

        # Ejecutar estrategia
        update_job_status(job_id, {'progress': 50}, conn=conn)

        results = fetch_trends_strategy(geo, category, provider_name=provider, **credentials)

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
    return render_template('trends/dashboard.html')

@trends_bp.route('/trends/start', methods=['POST'])
def start_analysis():
    init_db()
    job_id = str(uuid.uuid4())
    geo = request.form.get('geo', 'ES')
    category = request.form.get('category', 'h')
    dataforseo_login = request.form.get('dataforseo_login', '').strip()
    dataforseo_password = request.form.get('dataforseo_password', '').strip()

    # Create initial job record
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO jobs (job_id, active, progress, log, data, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
              (job_id, 1, 0, json.dumps(["🚀 Iniciando..."]), json.dumps([]), None, time.time()))
    conn.commit()
    conn.close()

    t = threading.Thread(target=worker_realtime_trends, args=(job_id, geo, category, dataforseo_login, dataforseo_password))
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
