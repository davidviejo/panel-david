# Runbook: Despliegue y Configuración

## 1. Configuración en Render

Este proyecto está configurado para desplegarse automáticamente en Render utilizando el archivo `render.yaml` (Blueprint).

### Variables de Entorno

Una vez creado el servicio en Render, debes configurar manualmente las siguientes variables de entorno en el servicio **backend-p2**:

1.  **CLIENTS_AREA_PASSWORD_HASH**: El hash bcrypt de la contraseña global para el área de clientes.
    *   Generar hash: `python3 -c "import bcrypt; print(bcrypt.hashpw(b'TU_CONTRASEÑA', bcrypt.gensalt()).decode())"`
2.  **OPERATOR_PASSWORD_HASH**: El hash bcrypt de la contraseña global para el operador.
    *   Generar hash: `python3 -c "import bcrypt; print(bcrypt.hashpw(b'TU_CONTRASEÑA', bcrypt.gensalt()).decode())"`
3.  **JWT_SECRET**: (Se genera automáticamente si usas el Blueprint, pero puedes rotarla).

### Base de Datos de Proyectos

Actualmente, los proyectos y sus contraseñas se gestionan en archivos JSON:

*   `backend/p2/projects_db.json`: Lista de proyectos (id, name, domain, etc.).
*   `backend/p2/auth_db.json`: Contraseñas de cada proyecto.
    *   Formato: `{"project_hashes": {"ID_PROYECTO": "HASH_BCRYPT"}}`

Para añadir un nuevo proyecto:
1.  Añádelo a `projects_db.json`.
2.  Genera el hash de su contraseña.
3.  Añádelo a `auth_db.json` con el mismo ID.
4.  Haz commit y push.

## 2. Configuración DNS (agenciaseo.davidviejo.com)

Para apuntar tu subdominio al frontend desplegado en Render:

1.  Ve al dashboard de tu servicio **frontend-m3** en Render.
2.  En la sección "Custom Domains", añade `agenciaseo.davidviejo.com`.
3.  Render te proporcionará un registro CNAME (e.g., `frontend-m3-xxxx.onrender.com`).
4.  Ve a tu proveedor de dominio (donde compraste davidviejo.com).
5.  Añade un registro DNS tipo **CNAME**:
    *   **Host/Name**: `agenciaseo`
    *   **Value/Target**: `frontend-m3-xxxx.onrender.com` (el valor que te dio Render).
6.  Espera a que se propague (puede tardar hasta 48h, pero suele ser rápido). Render generará automáticamente el certificado SSL.

## 3. Uso Local

1.  **Backend**:
    ```bash
    cd backend/p2
    pip install -r requirements.txt
    export CLIENTS_AREA_PASSWORD_HASH='...' # Hash de prueba
    export OPERATOR_PASSWORD_HASH='...'      # Hash de prueba
    export JWT_SECRET='dev-secret'
    python run.py
    ```
2.  **Frontend**:
    ```bash
    cd frontend/m3
    npm install
    # Crea .env con VITE_API_URL=http://localhost:5000
    npm run dev
    ```
