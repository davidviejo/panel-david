# Flask Server Runbook

## Overview
The backend is a Flask application served by Gunicorn. It includes a clients portal with JWT authentication.

## Environment Variables
Ensure these are set in Render:
- `CLIENTS_AREA_PASSWORD`: (Required) Password for the main clients area.
- `OPERATOR_PASSWORD`: (Required) Password for the operator area.
- `JWT_SECRET`: (Required) Secret key for signing JWTs. Render can generate this.
- `FRONTEND_URL`: (Optional) URL of the frontend for CORS. Defaults to `https://agenciaseo.davidviejo.com`.
- `FLASK_DEBUG`: Set to `false` for production.

## Deployment
The `render.yaml` file defines the service.
- **Build Command:** `pip install -r backend/p2/requirements.txt && python -m spacy download es_core_news_sm`
- **Start Command:** `gunicorn backend.p2.run:app --bind 0.0.0.0:$PORT`
- **PYTHONPATH:** Must be set to `backend/p2` so imports work correctly.

## DNS
Point `agenciaseo.davidviejo.com` to the Render frontend service.

## Clients Data
Currently stored in `clients_db.json`. To add a client, update this file or use the (future) admin tool.
Structure:
```json
[
  {
    "slug": "demo-project",
    "name": "Demo Project",
    "status": "active",
    "description": "A demo project.",
    "project_password_hash": "$2b$12$..."
  }
]
```
To generate a hash:
```python
import bcrypt
bcrypt.hashpw(b"yourpassword", bcrypt.gensalt()).decode('utf-8')
```
