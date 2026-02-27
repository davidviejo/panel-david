import os
from apps import create_app
from flask_cors import CORS

app = create_app()
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    print(f"🚀 SEO Mega-Suite v17 (Completa): http://127.0.0.1:{port}")
    app.run(debug=debug, use_reloader=False, port=port)
