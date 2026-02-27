from flask import Blueprint, render_template, request, jsonify, send_file
import requests
from bs4 import BeautifulSoup
import json
import concurrent.futures
import pandas as pd
import io

schema_bp = Blueprint('schema_tool', __name__, url_prefix='/schema_tool')

def extract(url):
    result = {'url': url, 'types': [], 'raw': [], 'details': {}, 'status': 0}
    try:
        response = requests.get(url, headers={'User-Agent':'Mozilla/5.0'}, timeout=8)
        result['status'] = response.status_code
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            for script in soup.find_all('script', type='application/ld+json'):
                if script.string:
                    try:
                        json_content = json.loads(script.string)
                        result['raw'].append(json_content)
                        items = json_content if isinstance(json_content, list) else [json_content]
                        for item in items:
                            if isinstance(item, dict):
                                result['types'].append(item.get('@type', 'Unknown'))
                    except: pass
            result['types'] = list(set(result['types']))
    except Exception as e: result['status'] = str(e)
    return result

@schema_bp.route('/')
def index(): return render_template('schema_tool/dashboard.html')

@schema_bp.route('/scan', methods=['POST'])
def scan():
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(extract, u): u for u in (request.get_json(silent=True) or {}).get('urls', []) if u.strip()}
        for future in concurrent.futures.as_completed(futures): results.append(future.result())
    return jsonify({'status':'ok', 'data':results})

@schema_bp.route('/download', methods=['POST'])
def download():
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        pd.DataFrame((request.get_json(silent=True) or {}).get('data', [])).to_excel(writer, index=False)
    output.seek(0)
    return send_file(output, download_name='schema.xlsx', as_attachment=True)
