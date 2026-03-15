import time
import random
import threading
import requests
import atexit
import logging
import base64
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import urllib.parse
from typing import List, Dict, Optional, Any, Union
from flask import session, has_request_context
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from concurrent.futures import ThreadPoolExecutor
from apps.web.blueprints.usage_tracker import increment_api_usage
from apps.core.config import Config
from apps.tools.utils import is_safe_url, sanitize_log_message

class GoogleAPIError(Exception):
    pass

# --- ROBUST SCRAPING SESSION ---
def create_robust_session() -> requests.Session:
    """
    Creates a robust reusable requests Session with automatic retries for server errors
    and timeouts.
    """
    session = requests.Session()

    # Configure retry strategy
    retry_strategy = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"]
    )

    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

# Global reusable session
robust_session = create_robust_session()


def get_optimized_headers(cookie: Optional[str] = None) -> Dict[str, str]:
    """
    Genera cabeceras HTTP optimizadas para simular un navegador real.

    Args:
        cookie (str, optional): Cookie personalizada para la petición.

    Returns:
        dict: Diccionario de cabeceras incluyendo User-Agent y cookies.
    """
    headers = {
        'User-Agent': random.choice(Config.USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    }
    if cookie:
        headers['Cookie'] = cookie
    elif Config.DEFAULT_COOKIE:
        # Cookie mínima de consentimiento
        headers['Cookie'] = Config.DEFAULT_COOKIE
    return headers

def parse_google_html(html_content: str) -> List[Dict[str, str]]:
    """
    Analiza el HTML de una página de resultados de Google (SERP) para extraer URLs y títulos.

    Args:
        html_content (str): El contenido HTML de la SERP.

    Returns:
        list: Lista de diccionarios con 'url' y 'title' de los resultados orgánicos.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    results: List[Dict[str, str]] = []

    # INTENTO 1: Selectores Modernos (Para modo Nuclear/Cookies)
    # Google moderno usa estructuras complejas. Buscamos el contenedor principal 'g'
    # o atributos data-header-feature que suelen indicar resultados
    for result_div in soup.select('div.g'):
        # Filtrar basura (widgets, "otras preguntas", etc)
        if result_div.find_parent(class_=['mgAbYb', 'kno-kp']): continue

        anchor_tag = result_div.find('a')
        header_tag = result_div.find('h3')

        if anchor_tag and header_tag:
            link = anchor_tag['href']
            if link:
                title = header_tag.get_text(strip=True)

                # Limpieza de trackers de google (/url?q=...) si aparecen
                if '/url?q=' in link:
                    try:
                        link = link.split('/url?q=')[1].split('&')[0]
                        link = urllib.parse.unquote(link)
                    except Exception: pass

                if link.startswith('http') and 'google.' not in link:
                    if not any(r['url'] == link for r in results):
                        results.append({'url': link, 'title': title})

    # INTENTO 2: Selectores Legacy (Para modo GBV=1 / Sin cookies)
    if not results:
        for anchor_tag in soup.find_all('a', href=True):
            href = anchor_tag['href']
            if href.startswith('/url?q='):
                try:
                    clean = href.split('/url?q=')[1].split('&')[0]
                    clean = urllib.parse.unquote(clean)
                    if 'google.' in clean: continue

                    # En modo legacy el título suele estar en un h3 o div dentro del a
                    title_tag = anchor_tag.find('h3') or anchor_tag.find('div', class_='BNeawe') or anchor_tag.find('span')
                    if title_tag:
                        title = title_tag.get_text(strip=True)
                        if title and not any(r['url'] == clean for r in results):
                            results.append({'url': clean, 'title': title})
                except Exception: continue

    return results

def scrape_google_serp(keyword: str, num_results: int = 10, delay: Union[int, float] = 2, cookie: Optional[str] = None, tos: int = 15) -> Union[List[Dict[str, str]], str]:
    """
    Realiza un scraping de la SERP de Google para una palabra clave dada.

    Args:
        keyword (str): Palabra clave a buscar.
        num_results (int): Número aproximado de resultados deseados.
        delay (int/float): Tiempo de espera antes de la petición para evitar bloqueos.
        cookie (str, optional): Cookie de sesión de Google.
        tos (int): Tiempo de espera máximo para la petición (timeout).

    Returns:
        list: Lista de resultados o cadena "BLOCKED" si se detecta bloqueo 429.
    """
    try:
        time.sleep(float(delay))
        url = "https://www.google.es/search" # Forzamos .es para local

        params = {
            'q': keyword,
            'num': num_results + 5,
            'hl': 'es',
            'gl': 'es',
            'pws': '0',     # Desactivar personalización (historial)
            'filter': '0'   # Mostrar resultados omitidos
        }

        # SI NO HAY COOKIE -> Usamos modo ligero (GBV=1) para evitar bloqueos JS
        # SI HAY COOKIE -> Usamos modo normal (Sin GBV) para máxima precisión
        if not cookie:
            params['gbv'] = '1'

        response = requests.get(url, params=params, headers=get_optimized_headers(cookie), timeout=int(tos))

        if response.status_code == 429: return "BLOCKED"

        if response.status_code == 200:
            return parse_google_html(response.text)[:num_results]

    except Exception:
        logging.error("Request failed during Google SERP scrape", exc_info=True)

    return []

# --- GOOGLE API OFICIAL ---
def search_google_official(keyword: str, api_key: str, cx: str, num_results: int = 10, gl: str = 'es', hl: str = 'es', raise_on_error: bool = False) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    try:
        start_index = 1
        while len(results) < num_results:
            if start_index > 91: break

            # INCREMENTAR CONTADOR AQUÍ
            # Cada llamada a la API cuenta, aunque devuelva error o 0 resultados
            increment_api_usage(1)

            params = {'key': api_key, 'cx': cx, 'q': keyword, 'num': 10, 'start': start_index, 'gl': gl, 'hl': hl}
            response = requests.get("https://www.googleapis.com/customsearch/v1", params=params, timeout=10)
            data = response.json()

            if 'error' in data:
                msg = data['error']['message']

                # Traducción de errores comunes para usuarios
                if "Custom Search JSON API" in msg:
                    msg = "Error: El proyecto de Google Cloud no tiene habilitada la API 'Custom Search JSON API'. Por favor habilítala en la consola de Google Cloud."
                elif "Daily Limit Exceeded" in msg or "quota" in msg.lower():
                    msg = "Error: Se ha superado la cuota diaria de la API de Google."

                logging.error(f"Google API Error: {msg}")
                if raise_on_error:
                    raise GoogleAPIError(msg)
                return []

            if 'items' in data:
                for item in data['items']:
                    results.append({'url': item['link'], 'title': item.get('title', 'Sin título'), 'snippet': item.get('snippet', ''), 'rank': len(results)+1})
                    if len(results) >= num_results: break
            else: break
            start_index += 10
    except Exception as e:
        if isinstance(e, GoogleAPIError):
            raise e
        logging.error(f"Google Official Search Exception: {sanitize_log_message(str(e))}")
        return []
    return results[:num_results]

# --- DATAFORSEO API ---
def search_dataforseo(keyword: str, login: str, passw: str, num_results: int = 10, lang: str = 'es', country: str = 'es') -> List[Dict[str, Any]]:
    results = []
    try:
        increment_api_usage(1)
        url = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"

        # Mapeo simple de país. DataForSEO usa location_code o location_name.
        # Por defecto usamos 'Spain' si es 'es'.
        location_name = "Spain"
        if country.lower() in ['us', 'en', 'usa', 'united states']: location_name = "United States"
        elif country.lower() in ['fr', 'france']: location_name = "France"
        elif country.lower() in ['de', 'germany']: location_name = "Germany"
        elif country.lower() in ['it', 'italy']: location_name = "Italy"
        # Se puede extender según necesidad

        # Codificar keyword en base64 - NO NECESARIO PARA ESTE ENDPOINT
        auth_b64 = base64.b64encode(f"{login}:{passw}".encode('utf-8')).decode('utf-8')

        payload = [{
            "keyword": keyword,
            "language_code": lang[:2],
            "location_name": location_name,
            "depth": max(100, num_results + 20) # DataForSEO cuenta todos los elementos. Un depth bajo puede omitir orgánicos.
        }]

        headers = {
            'Authorization': f"Basic {auth_b64}",
            'Content-Type': 'application/json'
        }

        response = requests.post(url, json=payload, headers=headers, timeout=60)
        data = response.json()

        if data.get('status_code') == 20000:
            for task in data.get('tasks', []):
                if task.get('result') and task['result'][0].get('items'):
                    for item in task['result'][0]['items']:
                        if item.get('type') == 'organic':
                            results.append({
                                'url': item.get('url'),
                                'title': item.get('title', 'Sin título'),
                                'snippet': item.get('description', ''),
                                'rank': item.get('rank_group', 0)
                            })
                            if len(results) >= num_results: break
        else:
            logging.error(f"DataForSEO Error: {data.get('status_message')}")

    except Exception as e:
        logging.error(f"DataForSEO Exception: {sanitize_log_message(str(e))}")

    return results[:num_results]

# --- SERPAPI ---
def search_serpapi(keyword: str, api_key: str, num_results: int = 10, gl: str = 'es', hl: str = 'es') -> List[Dict[str, Any]]:
    """
    Realiza una búsqueda en Google usando SerpApi.
    """
    results = []
    try:
        increment_api_usage(1)
        url = "https://serpapi.com/search"

        # Ajuste de dominio de Google según país
        google_domain = "google.es"
        if gl.lower() in ['us', 'en', 'usa', 'united states']: google_domain = "google.com"
        elif gl.lower() in ['fr', 'france']: google_domain = "google.fr"
        elif gl.lower() in ['de', 'germany']: google_domain = "google.de"
        elif gl.lower() in ['it', 'italy']: google_domain = "google.it"
        elif gl.lower() in ['uk', 'united kingdom']: google_domain = "google.co.uk"

        params = {
            "engine": "google",
            "q": keyword,
            "api_key": api_key,
            "num": num_results + 5,
            "gl": gl,
            "hl": hl,
            "google_domain": google_domain
        }

        response = requests.get(url, params=params, timeout=30)
        data = response.json()

        if "error" in data:
            logging.error(f"SerpApi Error: {data['error']}")
            return []

        if "organic_results" in data:
            for item in data["organic_results"]:
                results.append({
                    'url': item.get('link'),
                    'title': item.get('title', 'Sin título'),
                    'snippet': item.get('snippet', ''),
                    'rank': item.get('position', len(results)+1)
                })
                if len(results) >= num_results: break
    except Exception as e:
        logging.error(f"SerpApi Exception: {sanitize_log_message(str(e))}")

    return results[:num_results]

# --- UNIFIED SMART SEARCH ---
def smart_serp_search(keyword: str, config: Optional[Dict] = None, num_results: int = 10, lang: str = 'es', country: str = 'es') -> List[Dict[str, Any]]:
    """
    Función de búsqueda unificada que selecciona el mejor proveedor disponible.
    Prioriza DataForSEO si está configurado globalmente, o respeta el modo explícito.

    Args:
        keyword (str): Keyword a buscar.
        config (dict): Configuración que puede venir del request (mode, keys, cookies).
        num_results (int): Cantidad de resultados.

    Returns:
        List[Dict]: Lista de resultados estandarizada [{'url':..., 'title':..., 'snippet':...}]
    """
    cfg = config or {}

    # Inject session defaults if available
    if has_request_context():
        if not cfg.get('dfs_login'): cfg['dfs_login'] = session.get('dataforseo_login')
        if not cfg.get('dfs_pass'): cfg['dfs_pass'] = session.get('dataforseo_pass')
        if not cfg.get('cse_key'): cfg['cse_key'] = session.get('google_cse_key')
        if not cfg.get('cse_cx'): cfg['cse_cx'] = session.get('google_cse_cx')
        if not cfg.get('cookie'): cfg['cookie'] = session.get('scraping_cookie')
        # Nuevas configuraciones
        if not cfg.get('serpapi_key'): cfg['serpapi_key'] = session.get('serpapi_key')
        if not cfg.get('serp_provider'): cfg['serp_provider'] = session.get('serp_provider')

    # Inject settings from db if missing
    try:
        from apps.core.database import get_user_settings
        settings = get_user_settings('default') or {}
        if not cfg.get('dfs_login'): cfg['dfs_login'] = settings.get('dataforseo_login')
        if not cfg.get('dfs_pass'): cfg['dfs_pass'] = settings.get('dataforseo_password')
        if not cfg.get('serpapi_key'): cfg['serpapi_key'] = settings.get('serpapi_key')
    except Exception as e:
        logging.error(f"Error loading settings for smart_serp_search: {e}")

    mode = cfg.get('mode')
    provider = cfg.get('serp_provider')

    # --- 1. MODO EXPLÍCITO (Prioridad Máxima por argumento) ---
    if mode == 'serpapi' and cfg.get('serpapi_key'):
        return search_serpapi(keyword, cfg['serpapi_key'], num_results, gl=country, hl=lang)

    if mode == 'dataforseo' and cfg.get('dfs_login') and cfg.get('dfs_pass'):
        return search_dataforseo(keyword, cfg['dfs_login'], cfg['dfs_pass'], num_results, lang, country)

    if mode == 'google_api_official':
         api_key = cfg.get('cse_key') or cfg.get('key')
         cx = cfg.get('cse_cx') or cfg.get('cx')
         if api_key and cx:
            return search_google_official(keyword, api_key, cx, num_results, gl=country, hl=lang)

    if mode in ['google_scraping', 'google_nuclear']:
         c = cfg.get('cookie')
         delay = cfg.get('delay', 2)
         res = scrape_google_serp(keyword, num_results, delay, cookie=c)
         if isinstance(res, list):
            for r in res:
                if 'snippet' not in r: r['snippet'] = ''
            return res

    # --- 2. SELECTOR DE PROVEEDOR GLOBAL (Si no hay modo explícito) ---
    if not mode or mode == 'auto':
        # SerpApi Preference
        if provider == 'serpapi' and cfg.get('serpapi_key'):
            return search_serpapi(keyword, cfg['serpapi_key'], num_results, gl=country, hl=lang)

        # DataForSEO Preference
        if provider == 'dataforseo' and cfg.get('dfs_login') and cfg.get('dfs_pass'):
             return search_dataforseo(keyword, cfg['dfs_login'], cfg['dfs_pass'], num_results, lang, country)

        # Google Official Preference
        if provider == 'google_official':
             api_key = cfg.get('cse_key') or cfg.get('key')
             cx = cfg.get('cse_cx') or cfg.get('cx')
             if api_key and cx:
                return search_google_official(keyword, api_key, cx, num_results, gl=country, hl=lang)

        # Google Scraping Preference
        if provider == 'google_scraping':
             c = cfg.get('cookie')
             delay = cfg.get('delay', 2)
             res = scrape_google_serp(keyword, num_results, delay, cookie=c)
             if isinstance(res, list):
                for r in res:
                    if 'snippet' not in r: r['snippet'] = ''
                return res

    # --- 3. FALLBACKS AUTOMÁTICOS (Legacy logic) ---

    # 3.1 DataForSEO (Si hay credenciales en config/sesión)
    dfs_login = cfg.get('dfs_login') or Config.DATAFORSEO_LOGIN
    dfs_pass = cfg.get('dfs_pass') or Config.DATAFORSEO_PASSWORD

    if dfs_login and dfs_pass:
        return search_dataforseo(keyword, dfs_login, dfs_pass, num_results, lang, country)

    # 3.2 Google API Oficial
    api_key = cfg.get('cse_key') or cfg.get('key')
    cx = cfg.get('cse_cx') or cfg.get('cx')

    if api_key and cx:
        return search_google_official(keyword, api_key, cx, num_results, gl=country, hl=lang)

    # 3.3 DuckDuckGo (Fallback final)
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            region = "es-es" if "es" in lang.lower() else "us-en"
            ddg_results = []
            # Pedimos más para filtrar
            for r in ddgs.text(keyword, region=region, max_results=num_results+5):
                ddg_results.append({
                    'url': r.get('href'),
                    'title': r.get('title'),
                    'snippet': r.get('body', ''),
                    'rank': len(ddg_results)+1
                })
                if len(ddg_results) >= num_results: break
            return ddg_results
    except Exception as e:
        logging.error(f"Smart Search DDG Fallback Error: {e}")
        return []


# --- BROWSER MANAGEMENT ---
# NOTE: Playwright objects are not thread-safe. This implementation assumes
# a process-based worker model (e.g., Gunicorn sync workers) where each
# worker process has its own isolated Playwright instance.
_PLAYWRIGHT_CONTEXT = None
_PLAYWRIGHT = None
_BROWSER = None
_BROWSER_LOCK = threading.Lock()

def cleanup_browser() -> None:
    global _BROWSER, _PLAYWRIGHT, _PLAYWRIGHT_CONTEXT
    with _BROWSER_LOCK:
        if _BROWSER:
            try:
                _BROWSER.close()
            except Exception:
                pass
            _BROWSER = None
        if _PLAYWRIGHT:
            try:
                _PLAYWRIGHT.stop()
            except Exception:
                pass
            _PLAYWRIGHT = None
        _PLAYWRIGHT_CONTEXT = None

atexit.register(cleanup_browser)

def get_browser() -> Any:
    global _PLAYWRIGHT_CONTEXT, _PLAYWRIGHT, _BROWSER
    with _BROWSER_LOCK:
        if _BROWSER is None:
            try:
                _PLAYWRIGHT_CONTEXT = sync_playwright()
                _PLAYWRIGHT = _PLAYWRIGHT_CONTEXT.start()
                _BROWSER = _PLAYWRIGHT.chromium.launch(headless=True)
            except Exception as e:
                # Si falla, limpiamos manualmente para evitar deadlock llamando a cleanup_browser
                if _BROWSER:
                    try:
                        _BROWSER.close()
                    except Exception: pass
                    _BROWSER = None
                if _PLAYWRIGHT:
                    try:
                        _PLAYWRIGHT.stop()
                    except Exception: pass
                    _PLAYWRIGHT = None
                _PLAYWRIGHT_CONTEXT = None
                raise e
        return _BROWSER

# --- SCRAPER HÍBRIDO ---
def _fetch_with_requests(url: str) -> Dict[str, Any]:
    """
    Ayudante interno para obtener una URL usando `requests`. Ruta rápida.

    Args:
        url (str): URL a obtener.

    Returns:
        dict: Resultado con 'content', 'status', 'method', 'error'.
    """
    try:
        response = requests.get(url, headers=get_optimized_headers(), timeout=10)
        if response.status_code == 200 and len(response.content) > 500:
             return {'url': url, 'content': response.content, 'status': response.status_code, 'method': 'Requests', 'error': None}
        return {'url': url, 'content': None, 'status': response.status_code, 'method': 'Requests', 'error': None}
    except Exception as e:
        logging.error(f"Scraper Request Error for {url}: {e}")
        return {'url': url, 'content': None, 'status': 0, 'method': 'Requests', 'error': 'Error de conexión'}

def _fetch_with_playwright(url: str) -> Dict[str, Any]:
    """
    Ayudante interno para obtener una URL usando `playwright`. Ruta lenta para sitios con mucho JS.

    Args:
        url (str): URL a obtener.

    Returns:
        dict: Resultado con 'content', 'status', 'method', 'error'.
    """
    result: Dict[str, Any] = {'url': url, 'content': None, 'status': 0, 'method': 'Playwright (JS)', 'error': None}
    try:
        browser = get_browser()
        try:
            page = browser.new_page()
        except Exception:
            # Si el navegador falló o se cerró, reiniciamos una vez
            cleanup_browser()
            browser = get_browser()
            page = browser.new_page()

        try:
            page.goto(url, timeout=20000)
            result['content'] = page.content()
            result['status'] = 200
        finally:
            page.close()
    except Exception as e:
        logging.error(f"Scraper Playwright Error for {url}: {e}")
        result['error'] = 'Error de navegación'
    return result

def fetch_url_hybrid(url: str, delay: Union[int, float] = 0) -> Dict[str, Any]:
    """
    Intenta obtener el contenido de una URL utilizando `requests` (rápido) y, si falla o el contenido es insuficiente,
    recurre a `playwright` (lento, soporta JS).

    Args:
        url (str): La URL a obtener.
        delay (int/float): Tiempo de espera antes de la petición Requests.

    Returns:
        dict: Diccionario con 'url', 'content', 'status', 'method' y 'error'.
    """
    if not is_safe_url(url):
        return {'url': url, 'content': None, 'status': 0, 'method': 'Blocked', 'error': 'URL no permitida'}

    if delay > 0:
        time.sleep(delay)

    # Try requests first
    result = _fetch_with_requests(url)
    if result['content']:
        return result

    # Fallback to Playwright if requests failed to get content (or got small content/non-200)
    # So if that failed, we try playwright.

    return _fetch_with_playwright(url)

def get_soup(url: str, delay: int = 0) -> Optional[BeautifulSoup]:
    result = fetch_url_hybrid(url, delay)
    return BeautifulSoup(result['content'], 'html.parser') if result['content'] else None

# --- NEW ROBUST URL FETCHING ---
def fetch_url(url: str, connect_timeout: int = 10, read_timeout: int = 30, random_delay: bool = True) -> Dict[str, Any]:
    """
    Robust HTTP fetching wrapper using the global robust session.

    Args:
        url (str): The URL to fetch.
        connect_timeout (int): Connect timeout in seconds.
        read_timeout (int): Read timeout in seconds.
        random_delay (bool): If True, wait 1-3 seconds before fetching.

    Returns:
        dict: A structured dictionary with status and extracted information.
    """
    if random_delay:
        time.sleep(random.uniform(1, 3))

    start_time = time.time()

    result = {
        'url': url,
        'ok': False,
        'status_code': None,
        'final_url': None,
        'html': None,
        'error_type': None,
        'error_message': None,
        'elapsed_ms': 0
    }

    try:
        response = robust_session.get(
            url,
            headers=get_optimized_headers(),
            timeout=(connect_timeout, read_timeout)
        )

        # Calculate elapsed time
        result['elapsed_ms'] = int((time.time() - start_time) * 1000)
        result['status_code'] = response.status_code
        result['final_url'] = response.url

        if response.status_code == 200:
            result['ok'] = True
            result['html'] = response.text
            logging.info(f"fetch_url OK: {url} | Status: {response.status_code} | Time: {result['elapsed_ms']}ms")
        elif response.status_code == 403:
            result['error_type'] = 'blocked_403'
            result['error_message'] = f"HTTP {response.status_code}"
            logging.warning(f"fetch_url BLOCKED: {url} | Status: {response.status_code} | Time: {result['elapsed_ms']}ms")
        elif response.status_code == 429:
            result['error_type'] = 'rate_limited_429'
            result['error_message'] = f"HTTP {response.status_code}"
            logging.warning(f"fetch_url RATE_LIMITED: {url} | Status: {response.status_code} | Time: {result['elapsed_ms']}ms")
        else:
            result['error_type'] = 'other'
            result['error_message'] = f"HTTP {response.status_code}"
            logging.warning(f"fetch_url OTHER HTTP ERROR: {url} | Status: {response.status_code} | Time: {result['elapsed_ms']}ms")

    except requests.exceptions.ConnectTimeout as e:
        result['elapsed_ms'] = int((time.time() - start_time) * 1000)
        result['error_type'] = 'connect_timeout'
        result['error_message'] = str(e)
        logging.error(f"fetch_url CONNECT TIMEOUT: {url} | Time: {result['elapsed_ms']}ms | Error: {e}")
    except requests.exceptions.ReadTimeout as e:
        result['elapsed_ms'] = int((time.time() - start_time) * 1000)
        result['error_type'] = 'read_timeout'
        result['error_message'] = str(e)
        logging.error(f"fetch_url READ TIMEOUT: {url} | Time: {result['elapsed_ms']}ms | Error: {e}")
    except requests.exceptions.SSLError as e:
        result['elapsed_ms'] = int((time.time() - start_time) * 1000)
        result['error_type'] = 'ssl_error'
        result['error_message'] = str(e)
        logging.error(f"fetch_url SSL ERROR: {url} | Time: {result['elapsed_ms']}ms | Error: {e}")
    except requests.exceptions.ConnectionError as e:
        result['elapsed_ms'] = int((time.time() - start_time) * 1000)
        error_str = str(e).lower()
        if 'name resolution' in error_str or 'nodename nor servname' in error_str:
            result['error_type'] = 'dns_error'
        else:
            result['error_type'] = 'connection_error'
        result['error_message'] = str(e)
        logging.error(f"fetch_url CONNECTION ERROR ({result['error_type']}): {url} | Time: {result['elapsed_ms']}ms | Error: {e}")
    except requests.exceptions.RequestException as e:
        result['elapsed_ms'] = int((time.time() - start_time) * 1000)
        result['error_type'] = 'other'
        result['error_message'] = str(e)
        logging.error(f"fetch_url REQUEST ERROR: {url} | Time: {result['elapsed_ms']}ms | Error: {e}")
    except Exception as e:
        result['elapsed_ms'] = int((time.time() - start_time) * 1000)
        result['error_type'] = 'other'
        result['error_message'] = str(e)
        logging.error(f"fetch_url OTHER ERROR: {url} | Time: {result['elapsed_ms']}ms | Error: {e}")

    return result

def fetch_many(urls: List[str], max_workers: int = 5, connect_timeout: int = 10, read_timeout: int = 30, random_delay: bool = True) -> List[Dict[str, Any]]:
    """
    Robust HTTP fetching wrapper to process multiple URLs concurrently.

    Args:
        urls (List[str]): List of URLs to fetch.
        max_workers (int): Maximum number of concurrent workers.
        connect_timeout (int): Connect timeout in seconds.
        read_timeout (int): Read timeout in seconds.
        random_delay (bool): If True, wait 1-3 seconds before fetching each URL.

    Returns:
        List[Dict[str, Any]]: A list of dictionaries with status and extracted information, in the same order as the input URLs.
    """
    results_map: Dict[str, Dict[str, Any]] = {}

    def fetch_task(url: str) -> None:
        try:
            results_map[url] = fetch_url(
                url,
                connect_timeout=connect_timeout,
                read_timeout=read_timeout,
                random_delay=random_delay
            )
        except Exception as e:
            # Fallback for unexpected task runner errors
            results_map[url] = {
                'url': url,
                'ok': False,
                'status_code': None,
                'final_url': None,
                'html': None,
                'error_type': 'task_error',
                'error_message': str(e),
                'elapsed_ms': 0
            }
            logging.error(f"fetch_many TASK ERROR for {url}: {e}")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        executor.map(fetch_task, urls)

    # Return results in the exact same order as the input URLs
    return [results_map[url] for url in urls]
