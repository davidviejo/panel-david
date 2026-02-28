from flask import Blueprint, request, jsonify, session, render_template
from apps.ai_hub import AI_MODELS, execute_ai_task, generate_ai_image
from apps.core.database import get_user_settings, upsert_user_settings
import logging

logger = logging.getLogger(__name__)

ai_bp = Blueprint('ai_tools', __name__)

@ai_bp.route('/settings', methods=['GET'])
def settings_page():
    """Renderiza el panel centralizado de Configuración & IA."""
    # 1. Recuperar settings de DB (Usuario default por ahora)
    user_settings = get_user_settings('default')

    # 2. Preparar lista de modelos para el frontend
    models_list = []
    for mid, m in AI_MODELS.items():
        models_list.append({
            'id': m['id'],
            'name': m['name'],
            'specialty': m['specialty'],
            'provider': m['provider'],
            'anonymity': m['anonymity'],
            'anonymity_label': m['anonymity_label'],
            'privacy_note': m['privacy_note'],
            'requires_key': m['requires_key'],
            'category': m.get('category', 'free')
        })

    # 3. Enmascarar claves para seguridad en frontend
    # Solo mostramos los últimos 4 chars si existe la clave
    masked_settings = user_settings.copy()
    sensitive_keys = ['openai_key', 'anthropic_key', 'dataforseo_password', 'serpapi_key']

    for k in sensitive_keys:
        val = masked_settings.get(k)
        if val and len(val) > 4:
            masked_settings[k] = 'sk-****' + val[-4:]
        elif val:
            masked_settings[k] = '****'

    # Fallbacks para valores no seteados
    if not masked_settings.get('default_model'):
        masked_settings['default_model'] = 'default'

    return render_template('settings.html',
                           models=models_list,
                           settings=masked_settings)

@ai_bp.route('/api/settings/update', methods=['POST'])
def update_settings_api():
    """Actualiza la configuración en DB y sincroniza la Sesión."""
    data = request.get_json(silent=True) or {}

    try:
        user_id = 'default'
        current_settings = get_user_settings(user_id)

        # 1. Filtrar claves vacías (para no borrar claves existentes si el usuario envía placeholder)
        # Si el usuario no tocó el input, el frontend podría no enviarlo o enviar la máscara.
        # Asumiremos que el frontend envía todo. Si el valor contiene '****', lo ignoramos.

        updates = {}
        valid_fields = [
            'default_model', 'privacy_mode', 'openai_key', 'anthropic_key',
            'dataforseo_login', 'dataforseo_password', 'serpapi_key',
            'memory_limit', 'system_prompt'
        ]

        for field in valid_fields:
            val = data.get(field)

            # Lógica de ignorar máscaras
            if val and '****' in str(val):
                continue # No actualizamos, mantenemos el valor de DB

            # Si viene vacío, ¿borramos o mantenemos?
            # UX estándar: Si está vacío, se borra. Si quieres mantener, no lo tocas.
            # Pero cuidado con los placeholders. El frontend debe manejar esto.
            # Aquí asumimos: Si valor es explícito (y no máscara), se guarda.
            if val is not None:
                updates[field] = val

        # 2. Guardar en DB
        if updates:
            upsert_user_settings(user_id, updates)

        # 3. Sincronizar Sesión (Para que las herramientas funcionen ya)
        # Fusionamos lo nuevo con lo que ya había en settings para tener el estado completo
        new_state = {**current_settings, **updates}

        # Mapear a las claves de sesión que usa el sistema legacy
        session['ai_model'] = new_state.get('default_model', 'default')
        session['ai_high_privacy'] = bool(new_state.get('privacy_mode', 0))
        session['openai_key'] = new_state.get('openai_key')
        session['anthropic_key'] = new_state.get('anthropic_key')
        session['dataforseo_login'] = new_state.get('dataforseo_login')
        session['dataforseo_pass'] = new_state.get('dataforseo_password')
        session['serpapi_key'] = new_state.get('serpapi_key')
        session['memory_context_window'] = 'standard' # Simplificación, o mapear memory_limit

        # Mapeo extra para memory_limit -> memory_context_window si queremos
        limit = int(new_state.get('memory_limit', 4096))
        if limit < 8000: session['memory_context_window'] = 'short'
        elif limit > 32000: session['memory_context_window'] = 'long'
        else: session['memory_context_window'] = 'standard'

        return jsonify({'status': 'ok', 'message': 'Configuración guardada y aplicada.'})

    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@ai_bp.route('/ai/dashboard', methods=['GET'])
def dashboard():
    """Renderiza la página de configuración de modelos IA."""
    models_list = []
    for mid, m in AI_MODELS.items():
        models_list.append({
            'id': m['id'],
            'name': m['name'],
            'specialty': m['specialty'],
            'provider': m['provider'],
            'anonymity': m['anonymity'],
            'anonymity_label': m['anonymity_label'],
            'privacy_note': m['privacy_note'],
            'requires_key': m['requires_key'],
            'category': m.get('category', 'free')
        })

    current_model = session.get('ai_model', 'default')
    high_privacy = session.get('ai_high_privacy', False)

    # Global Configs
    config = {
        'openai_key': session.get('openai_key', ''),
        'anthropic_key': session.get('anthropic_key', ''),
        'google_key': session.get('google_key', ''),
        'dataforseo_login': session.get('dataforseo_login', ''),
        'dataforseo_pass': session.get('dataforseo_pass', ''),
        'google_cse_key': session.get('google_cse_key', ''),
        'google_cse_cx': session.get('google_cse_cx', ''),
        'scraping_cookie': session.get('scraping_cookie', ''),
        'memory_context_window': session.get('memory_context_window', 'standard'),
        'serp_provider': session.get('serp_provider', 'auto'),
        'serpapi_key': session.get('serpapi_key', '')
    }

    return render_template('ai/dashboard.html',
                           models=models_list,
                           current_model=current_model,
                           high_privacy=high_privacy,
                           config=config)

@ai_bp.route('/ai/config', methods=['GET'])
def get_config():
    """Retorna los modelos disponibles y la configuración actual del usuario."""
    models_list = []
    for mid, m in AI_MODELS.items():
        models_list.append({
            'id': m['id'],
            'name': m['name'],
            'specialty': m['specialty'],
            'provider': m['provider'],
            'anonymity': m['anonymity'],
            'anonymity_label': m['anonymity_label'],
            'privacy_note': m['privacy_note'],
            'requires_key': m['requires_key'],
            'category': m.get('category', 'free')
        })

    current_model = session.get('ai_model', 'default')
    high_privacy = session.get('ai_high_privacy', False)

    return jsonify({
        'models': models_list,
        'current_model': current_model,
        'high_privacy': high_privacy
    })

@ai_bp.route('/ai/preference', methods=['POST'])
def set_preference():
    """Guarda la preferencia de modelo, claves API globales y memoria en la sesión."""
    data = request.get_json(silent=True) or {}
    model_id = data.get('model_id')

    # Update AI Model if provided
    if model_id:
        if model_id != 'default' and model_id not in AI_MODELS:
            return jsonify({'error': 'Modelo no válido'}), 400
        session['ai_model'] = model_id

        # Specific key for this model (legacy support)
        api_key = data.get('api_key')
        if api_key:
            session[f'ai_key_{model_id}'] = api_key

    # Global Settings
    if 'high_privacy' in data:
        session['ai_high_privacy'] = data.get('high_privacy')

    # Global Keys
    global_keys = [
        'openai_key', 'anthropic_key', 'google_key',
        'dataforseo_login', 'dataforseo_pass',
        'google_cse_key', 'google_cse_cx',
        'scraping_cookie', 'memory_context_window',
        'serp_provider', 'serpapi_key'
    ]

    for key in global_keys:
        if key in data:
            session[key] = data[key]

    return jsonify({'status': 'ok', 'message': 'Configuración actualizada correctamente'})

@ai_bp.route('/ai/generate', methods=['POST'])
def generate_endpoint():
    """Endpoint directo para ejecutar tareas con modelos gratuitos."""
    data = request.get_json(silent=True) or {}
    prompt = data.get('prompt')
    model_id = data.get('model_id') or session.get('ai_model')

    if not prompt:
        return jsonify({'error': 'Prompt requerido'}), 400

    if not model_id or model_id == 'default':
        return jsonify({'error': 'Ningún modelo gratuito seleccionado.'}), 400

    # Recuperar clave de sesión si es necesaria
    api_key = session.get(f'ai_key_{model_id}')

    # Ejecutar
    result = execute_ai_task(prompt, model_id, api_key)
    return jsonify(result)
