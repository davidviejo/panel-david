import os
from apps import create_app
from flask_cors import CORS

app = create_app()

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Permitir origen configurado en Render (recomendado)
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host="0.0.0.0", debug=debug, use_reloader=False, port=port)
