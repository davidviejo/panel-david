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
from typing import List, Dict, Any, Optional

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

class TrendsProvider:
    """Clase base abstracta para proveedores de tendencias."""
    def fetch_trends(self, geo: str, category: str, **kwargs) -> List[Dict[str, Any]]:
        raise NotImplementedError

class GoogleInternalProvider(TrendsProvider):
    """Proveedor que usa la API interna (no oficial) de Google Trends."""

    def fetch_trends(self, geo: str, category: str, **kwargs) -> List[Dict[str, Any]]:
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

            # Limpiar prefijo de seguridad robustamente (puede tener espacios antes)
            prefix = ")]}',"
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
                    "traffic": source, # Usamos source como 'traffic' en UI legacy o 'N/A'
                    "context": context,
                    "google_link": link
                })
                rank_c += 1

            return results

        except Exception as e:
            logging.error(f"GoogleInternalProvider Error: {e}")
            raise e

class SerpApiProvider(TrendsProvider):
    """Proveedor que usa SerpApi (Google Trends)."""

    def fetch_trends(self, geo: str, category: str, **kwargs) -> List[Dict[str, Any]]:
        api_key = kwargs.get('api_key')
        if not api_key:
            raise ValueError("API Key requerida para SerpApi")

        url = "https://serpapi.com/search"
        # SerpApi 'google_trends_trending_now' no soporta categorías específicas igual que 'realtimetrends' a veces
        # Pero intentaremos pasarlo si existe soporte o ignorarlo.
        # En la implementación original no se pasaba 'cat' a SerpApi, solo 'geo'.
        # Si queremos categoría, SerpApi quizás no lo soporte en 'trending_now'.
        # Asumiremos 'geo' solo por compatibilidad.

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
            return results
        except Exception as e:
            logging.error(f"SerpApiProvider Error: {e}")
            raise e

class DataForSEOProvider(TrendsProvider):
    """
    Proveedor que usa DataForSEO.
    Intenta obtener tendencias usando 'dataforseo_labs/google/top_searches/live'.
    Nota: DataForSEO no tiene un endpoint directo de 'Trending Now' idéntico a Google.
    Usamos 'top_searches' como aproximación de lo más buscado.
    """

    def fetch_trends(self, geo: str, category: str, **kwargs) -> List[Dict[str, Any]]:
        login = kwargs.get('login')
        password = kwargs.get('password')

        if not login or not password:
             raise ValueError("Credenciales DataForSEO requeridas")

        url = "https://api.dataforseo.com/v3/dataforseo_labs/google/top_searches/live"

        location_name = ISO_TO_COUNTRY_NAME.get(geo, 'United States')
        language_code = "es" if geo in ['ES', 'MX', 'AR', 'CO', 'CL', 'PE'] else "en"

        # Base64 Auth
        creds = base64.b64encode(f"{login}:{password}".encode('utf-8')).decode('utf-8')
        headers = {
            "Authorization": f"Basic {creds}",
            "Content-Type": "application/json"
        }

        # DataForSEO top_searches payload
        payload = [{
            "location_name": location_name,
            "language_name": "Spanish" if language_code == "es" else "English",
            "limit": 20
            # "include_serp_info": False # Ahorrar créditos
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

            return results

        except Exception as e:
            logging.error(f"DataForSEOProvider Error: {e}")
            raise e

def fetch_trends_strategy(geo: str, category: str, provider_name: str = 'auto', **kwargs) -> List[Dict[str, Any]]:
    """
    Función helper para invocar la estrategia adecuada.
    """
    try:
        if provider_name == 'serpapi':
            return SerpApiProvider().fetch_trends(geo, category, **kwargs)
        elif provider_name == 'dataforseo':
            return DataForSEOProvider().fetch_trends(geo, category, **kwargs)
        else:
            # Fallback o 'auto' que por defecto es Google Internal
            return GoogleInternalProvider().fetch_trends(geo, category, **kwargs)
    except Exception as e:
        # Si falla el provider específico y era 'auto', podríamos intentar fallback?
        # Por simplicidad, propagamos el error para que el worker lo maneje
        raise e
