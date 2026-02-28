# apps/project_manager.py
from flask import (
    Blueprint, render_template, request, redirect,
    url_for, session, send_file
)
import json
import io
import pandas as pd
from datetime import datetime
from werkzeug.utils import secure_filename
import logging
from apps.core.database import (
    get_all_projects,
    get_project,
    upsert_project,
    replace_clusters,
    delete_project,
    reset_all_projects,
    bulk_insert_projects
)

project_bp = Blueprint('project_bp', __name__)


# --- RUTAS PRINCIPALES ---

def get_active_project():
    """Retrieve the active project from DB."""
    p_id = session.get('active_project_id')
    if p_id:
        p = get_project(p_id)
        if p:
            return p
    # Return default empty structure
    return {
        "id": 0,
        "name": "Sin Asignar",
        "domain": "",
        "geo": "ES",
        "clusters": []
    }


@project_bp.route('/projects/manager')
def manager():
    return render_template(
        'projects/manager.html',
        projects=get_all_projects(),
        active_id=str(session.get('active_project_id', 0))
    )


@project_bp.route('/projects/upload_clusters', methods=['POST'])
def upload_clusters():
    """
    Ruta para procesar Excel/CSV y actualizar los clústeres del proyecto
    """
    p_id = request.form.get('id')
    file = request.files.get('file')

    if not p_id or not file:
        return "Faltan datos", 400

    try:
        filename = secure_filename(file.filename)
        # Detectar formato
        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file)
        else:
            return "Formato no soportado", 400

        # Normalizar columnas (mayúsculas/minúsculas)
        df.columns = [c.lower().strip() for c in df.columns]

        # Buscar columnas clave
        col_name = next((
            c for c in df.columns
            if 'nombre' in c or 'cluster' in c or 'name' in c
        ), None)
        col_url = next((
            c for c in df.columns
            if 'url' in c or 'link' in c
        ), None)
        col_kw = next((
            c for c in df.columns
            if 'keyword' in c or 'clave' in c or 'kw' in c
        ), None)

        if not col_url:
            return "El archivo debe tener al menos una columna 'URL'", 400

        new_clusters = []
        for _, row in df.iterrows():
            url = str(row[col_url]).strip()
            if pd.isna(url) or url == 'nan' or not url:
                continue

            name = str(row[col_name]) if col_name and not pd.isna(row[col_name]) else url
            kw = str(row[col_kw]) if col_kw and not pd.isna(row[col_kw]) else ""

            new_clusters.append({
                "name": name,
                "url": url,
                "target_kw": kw
            })

        # Guardar en DB (Reemplazar clusters)
        replace_clusters(p_id, new_clusters)

        return redirect(url_for('project_bp.manager'))

    except Exception:
        logging.error("Error processing cluster upload", exc_info=True)
        return "Error interno al procesar el archivo.", 500


@project_bp.route('/projects/save', methods=['POST'])
def save():
    """
    Crea o actualiza un proyecto (Upsert).
    Procesa datos básicos y clústeres asociados.
    """
    p_id = request.form.get('id')
    if p_id:
        p_id = p_id.strip()
        if len(p_id) > 50:
            return "ID demasiado largo (máx 50 caracteres)", 400

    name = request.form.get('name')
    if name and len(name) > 100:
        return "Nombre demasiado largo (máx 100 caracteres)", 400

    # Procesar Clústeres
    c_names = request.form.getlist('cluster_name[]')
    c_urls = request.form.getlist('cluster_url[]')
    c_kws = request.form.getlist('cluster_kw[]')

    clusters_list = []
    if c_urls:
        for i in range(min(len(c_names), len(c_urls))):
            if c_names[i].strip() and c_urls[i].strip():
                clusters_list.append({
                    "name": c_names[i].strip(),
                    "url": c_urls[i].strip(),
                    "target_kw": c_kws[i].strip() if i < len(c_kws) else ""
                })

    # Si no hay ID, generar uno nuevo
    if not p_id:
        p_id = str(int(datetime.now().timestamp()))
        is_new = True
    else:
        is_new = False

    new_data = {
        "id": p_id,
        "name": request.form.get('name'),
        "domain": request.form.get('domain'),
        "geo": request.form.get('geo'),
        "competitors": request.form.get('competitors'),
        "brand_name": request.form.get('brand_name', ''),
        "sitemap_url": request.form.get('sitemap_url', ''),
        "business_type": request.form.get('business_type', 'blog'),
    }

    # Guardar Proyecto
    upsert_project(new_data)

    # Lógica de preservación de clusters:
    # Si 'clusters_list' tiene datos, reemplazamos.
    # Si 'clusters_list' está vacío:
    #   - Si es nuevo proyecto, no hacemos nada (queda sin clusters).
    #   - Si es proyecto existente, NO llamamos a replace_clusters,
    #     así preservamos los que ya estaban en BD.
    if clusters_list:
        replace_clusters(p_id, clusters_list)
    elif is_new:
        # Opcional: Asegurarnos que no tenga basura si el ID se reusara
        replace_clusters(p_id, [])

    # Si es el primer proyecto, activarlo
    projects = get_all_projects()
    if len(projects) == 1:
        session['active_project_id'] = p_id

    return redirect(url_for('project_bp.manager'))


# Rutas estándar (export, import, delete, set_active...)
@project_bp.route('/projects/export')
def export_db():
    """
    Exporta todos los proyectos y su configuración en un archivo JSON.
    Útil para backups o migración de datos.
    """
    mem = io.BytesIO()
    # Usamos get_all_projects que devuelve la estructura compatible con JSON
    mem.write(json.dumps(get_all_projects(), indent=4).encode('utf-8'))
    mem.seek(0)
    return send_file(
        mem,
        as_attachment=True,
        download_name='backup.json',
        mimetype='application/json'
    )


@project_bp.route('/projects/import', methods=['POST'])
def import_db():
    """
    Importa proyectos desde un archivo JSON, reemplazando la base de datos
    actual.
    """
    f = request.files.get('file')
    if f:
        projects_data = json.load(f)
        if not isinstance(projects_data, list):
            return "Archivo inválido: se espera una lista de proyectos", 400

        reset_all_projects()

        # Use bulk insert for performance
        bulk_insert_projects(projects_data)

    return redirect(url_for('project_bp.manager'))


@project_bp.route('/projects/reset_all')
def reset_all():
    reset_all_projects()
    session.clear()
    return redirect(url_for('project_bp.manager'))


@project_bp.route('/projects/set_active/<p_id>')
def set_active(p_id):
    session['active_project_id'] = p_id
    return redirect(request.referrer or '/')


@project_bp.route('/projects/delete/<p_id>')
def delete(p_id):
    delete_project(p_id)
    if str(session.get('active_project_id')) == str(p_id):
        session.pop('active_project_id', None)
    return redirect(url_for('project_bp.manager'))
