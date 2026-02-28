"""
Módulo Checklist Tool.

Realiza una auditoría básica de SEO On-Page para una lista de URLs.
Verifica imágenes, estructura de encabezados (H1-H3), enlaces internos, snippet y presencia de Schema.
"""

from flask import Blueprint, render_template, request, jsonify, send_file
import requests
from bs4 import BeautifulSoup
import pandas as pd
import io
import concurrent.futures
import re
from apps.utils import is_safe_url

checklist_bp = Blueprint('checklist', __name__, url_prefix='/checklist')

GOOGLE_MAPS_PATTERN = re.compile(r'google.*maps')

def check_url_compliance(url):
    """
    Analiza una URL individual para extraer métricas de conformidad SEO.

    Verificaciones:
    - Imágenes: Conteo total y cuántas faltan de texto ALT.
    - Estructura: Existencia de H1 único y lista de H1-H3.
    - Enlaces: Conteo de enlaces internos.
    - Snippet: Presencia de Title y Meta Description.
    - Otros: Geolocalización (iframe maps) y Datos Estructurados (JSON-LD).

    Args:
        url (str): La URL a analizar.

    Returns:
        dict: Diccionario con 'summary', 'images', 'headers', 'links', 'snippet'.
    """
    data = {'summary': {}, 'images': [], 'headers': [], 'links': [], 'snippet': {}}
    checklist_row = {'URL': url, 'Geolocalización': 'NO', 'Datos Estructurados': 'NO', 'Preguntas frecuentes': 'NO', 'Contenido': '0', 'Snippet': 'Falta', 'Imagenes': '0', 'Enlazado Interno': '0', 'Estructura': 'Mal'}

    if not is_safe_url(url):
        data['summary'] = checklist_row
        return data
    try:
        resp = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.content, 'html.parser')

            # Img: Verificar atributos alt
            imgs = soup.find_all('img')
            miss = sum(1 for i in imgs if not i.get('alt'))
            checklist_row['Imagenes'] = f"{len(imgs)} ({miss} sin alt)"
            for i in imgs: data['images'].append({'Origen':url, 'Src':i.get('src'), 'Alt':i.get('alt','MISSING')})

            # Struct: Verificar jerarquía de encabezados
            h1s = soup.find_all('h1')
            if len(h1s)==1: checklist_row['Estructura'] = 'Correcta'
            for h in soup.find_all(['h1','h2','h3']): data['headers'].append({'Tag':h.name, 'Txt':h.get_text(strip=True)})

            # Links: Extraer enlaces internos
            links = soup.find_all('a', href=True)
            checklist_row['Enlazado Interno'] = f"{len(links)}"
            for l in links: data['links'].append({'Href':l['href'], 'Anchor':l.get_text(strip=True)})

            # Snippet: Verificar meta etiquetas básicas
            t = soup.title.string if soup.title else ''
            m = soup.find('meta', attrs={'name':'description'})
            d = m['content'] if m else ''
            if t and d: checklist_row['Snippet'] = 'Completo'
            data['snippet'] = {'Title':t, 'Desc':d}

            # Geo/Schema: Detección simple de mapas y json-ld
            if soup.find('iframe', src=GOOGLE_MAPS_PATTERN): checklist_row['Geolocalización'] = 'SI'
            if soup.find('script', type='application/ld+json'): checklist_row['Datos Estructurados'] = 'SI'

    except: pass
    data['summary'] = checklist_row
    return data

@checklist_bp.route('/')
def index():
    """Renderiza el panel principal de la checklist."""
    return render_template('checklist/dashboard.html')

@checklist_bp.route('/run', methods=['POST'])
def run():
    """
    Ejecuta el análisis para múltiples URLs de forma concurrente.
    Usa ThreadPoolExecutor para mejorar el rendimiento con múltiples peticiones HTTP.
    """
    urls = (request.get_json(silent=True) or {}).get('urls', [])
    res = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
        ft = {ex.submit(check_url_compliance, u): u for u in urls}
        for f in concurrent.futures.as_completed(ft): res.append(f.result())
    return jsonify({'status': 'ok', 'data': res})

@checklist_bp.route('/download', methods=['POST'])
def download():
    """
    Genera un Excel multipestaña (Checklist, Images, Structure) con los resultados.
    """
    data = (request.get_json(silent=True) or {}).get('data', [])
    l_sum, l_img, l_head = [], [], []
    for i in data:
        if 'summary' in i: l_sum.append(i['summary'])
        l_img.extend(i.get('images', []))
        l_head.extend(i.get('headers', []))

    o = io.BytesIO()
    with pd.ExcelWriter(o, engine='openpyxl') as w:
        pd.DataFrame(l_sum).to_excel(w, index=False, sheet_name="Checklist")
        if l_img: pd.DataFrame(l_img).to_excel(w, index=False, sheet_name="Images")
        if l_head: pd.DataFrame(l_head).to_excel(w, index=False, sheet_name="Structure")
    o.seek(0)
    return send_file(o, download_name='checklist.xlsx', as_attachment=True)
