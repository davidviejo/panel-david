# apps/gsc_tool.py
from flask import Blueprint, render_template, jsonify
from apps.web.blueprints.project_manager import get_active_project
import random
import os
import logging
from datetime import datetime, timedelta

# Importaciones condicionales de Google
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    GOOGLE_LIBS = True
except ImportError:
    GOOGLE_LIBS = False

gsc_bp = Blueprint('gsc_bp', __name__)
CREDENTIALS_FILE = 'gsc_credentials.json' # Debes poner tu JSON de Google Cloud aquí

def get_gsc_service():
    """Autenticación con Google"""
    if not GOOGLE_LIBS or not os.path.exists(CREDENTIALS_FILE):
        return None
    try:
        creds = service_account.Credentials.from_service_account_file(
            CREDENTIALS_FILE, scopes=['https://www.googleapis.com/auth/webmasters.readonly']
        )
        return build('searchconsole', 'v1', credentials=creds)
    except Exception:
        return None

@gsc_bp.route('/gsc/dashboard')
def dashboard():
    return render_template('gsc/dashboard.html')

@gsc_bp.route('/gsc/data', methods=['POST'])
def get_data():
    project = get_active_project()
    domain = project.get('domain')

    # Asegurar formato GSC (sc-domain:midominio.com o https://...)
    if not domain.startswith('http') and not domain.startswith('sc-domain:'):
        site_url = f"sc-domain:{domain}"
    else:
        site_url = domain

    service = get_gsc_service()

    # Fechas (Últimos 28 días)
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=28)).strftime("%Y-%m-%d")

    data_rows = []

    if service:
        # --- MODO REAL (Si existe gsc_credentials.json) ---
        try:
            req = {
                'startDate': start_date,
                'endDate': end_date,
                'dimensions': ['date'],
                'rowLimit': 30
            }
            resp = service.searchanalytics().query(siteUrl=site_url, body=req).execute()
            rows = resp.get('rows', [])
            for r in rows:
                data_rows.append({
                    "date": r['keys'][0],
                    "clicks": r['clicks'],
                    "impressions": r['impressions'],
                    "ctr": round(r['ctr'] * 100, 2),
                    "position": round(r['position'], 1)
                })
        except Exception as e:
            logging.error(f"GSC Error: {str(e)}")
            return jsonify({"error": "Error conectando a GSC. Verifica permisos."})

    else:
        # --- MODO DEMO (Para que veas la gráfica sin configurar API) ---
        # Generamos datos realistas basados en una curva aleatoria
        base_clicks = random.randint(100, 500)
        for i in range(28):
            day = (datetime.now() - timedelta(days=28-i)).strftime("%Y-%m-%d")
            # Simular tendencia
            trend = (i * 2) + random.randint(-10, 20)
            clicks = max(0, base_clicks + trend)
            imps = clicks * random.randint(15, 25)
            data_rows.append({
                "date": day,
                "clicks": clicks,
                "impressions": imps,
                "ctr": round((clicks/imps)*100, 2) if imps > 0 else 0,
                "position": round(random.uniform(8, 12), 1)
            })

    # Preparar datos para Chart.js
    chart_data = {
        "labels": [r['date'] for r in data_rows],
        "clicks": [r['clicks'] for r in data_rows],
        "impressions": [r['impressions'] for r in data_rows],
        "position": [r['position'] for r in data_rows]
    }

    return jsonify({
        "status": "success",
        "mode": "REAL" if service else "DEMO",
        "site": site_url,
        "chart": chart_data,
        "totals": {
            "clicks": sum(chart_data['clicks']),
            "impressions": sum(chart_data['impressions'])
        }
    })