import os
import secrets

class Config:
    # Basic Config
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("No SECRET_KEY set for Flask application. This is required for security.")

    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size

    # Database
    DATABASE_URL = os.environ.get('DATABASE_URL')

    # Frontend URL for CORS
    FRONTEND_URL = os.environ.get('FRONTEND_URL') or 'http://localhost:5173'

    # Default consent cookie for Google scraping
    # SECURITY NOTE: This cookie should be rotated frequently and kept secret.
    DEFAULT_COOKIE = os.environ.get('GOOGLE_DEFAULT_COOKIE')
    if not DEFAULT_COOKIE:
        raise ValueError("No GOOGLE_DEFAULT_COOKIE set. This is required to prevent scraping blocks and must be explicitly configured.")

    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ]

    # DataForSEO Credentials
    DATAFORSEO_LOGIN = os.environ.get('DATAFORSEO_LOGIN')
    DATAFORSEO_PASSWORD = os.environ.get('DATAFORSEO_PASSWORD')

    # Portal Auth
    CLIENTS_AREA_PASSWORD = os.environ.get('CLIENTS_AREA_PASSWORD')
    OPERATOR_PASSWORD = os.environ.get('OPERATOR_PASSWORD')

    JWT_SECRET = os.environ.get('JWT_SECRET')
    if not JWT_SECRET:
        raise ValueError("No JWT_SECRET set. This is required for security.")

    # Job Runner Configuration
    JOBS_CONCURRENCY_LIMIT = int(os.environ.get('JOBS_CONCURRENCY_LIMIT', 2))
    JOBS_POLL_INTERVAL = int(os.environ.get('JOBS_POLL_INTERVAL', 5))
