import os
import secrets

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size

    # Default consent cookie for Google scraping
    # SECURITY NOTE: This cookie should be rotated frequently and kept secret.
    DEFAULT_COOKIE = os.environ.get('GOOGLE_DEFAULT_COOKIE') or 'SOCS=CAESHAgBEhJnd3NfMjAyMzA4MTAtMF9SQzIaAmVzIAEaBgiAo_qmBg; CONSENT=YES+cb.20210720-07-p0.en+FX+417'

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
    JWT_SECRET = os.environ.get('JWT_SECRET') or secrets.token_hex(32)
