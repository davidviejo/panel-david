from flask import Flask, render_template, jsonify
from config import Config
from apps.database import init_db

# --- IMPORTACIÓN DE TODAS LAS APPS EXISTENTES ---
from apps.seo_tool import seo_bp
from apps.ai_fixer import ai_bp as ai_fixer_bp
from apps.gsc_tool import gsc_bp
from apps.monitor_daemon import start_monitor, GLOBAL_ALERTS
from apps.entity_tool import entity_bp
from apps.audit_tool import audit_bp
from apps.content_gap import gap_bp
from apps.checklist_tool import checklist_bp
from apps.tools_extra import extra_bp
from apps.nlp_tool import nlp_bp
from apps.eeat_tool import eeat_bp
from apps.link_graph import graph_bp
from apps.structure_tool import structure_bp
from apps.link_opps import opps_bp
from apps.intent_tool import intent_bp
from apps.wpo_tool import wpo_bp
from apps.index_tool import index_bp
from apps.redirect_tool import redirect_bp
from apps.local_tool import local_bp
from apps.prominence_tool import prominence_bp
from apps.diff_tool import diff_bp
from apps.suggest_tool import suggest_bp
from apps.core_monitor import GLOBAL_STATE
from apps.link_health import health_bp
from apps.meta_gen import meta_gen_bp
from apps.image_audit import image_bp
from apps.bot_sim import bot_bp
from apps.hreflang_tool import hreflang_bp
from apps.content_extract import extract_bp
from apps.social_tool import social_bp
from apps.schema_tool import schema_bp
from apps.robots_tool import robots_bp
from apps.decay_tool import decay_bp
from apps.index_checker import indexer_bp
from apps.migration_tool import migration_bp
from apps.headers_tool import headers_bp
from apps.leads_tool import leads_bp
from apps.duplicate_tool import duplicate_bp
from apps.overlap_tool import overlap_bp
from apps.dorks_tool import dorks_bp
from apps.status_fast import fast_bp
from apps.tech_detector import tech_bp
from apps.ratio_tool import ratio_bp
from apps.sculpting_tool import sculpting_bp
from apps.draft_tool import draft_bp
from apps.pixel_tool import pixel_bp
from apps.anchor_tool import anchor_bp
from apps.crawler_tool import crawler_bp
from apps.kw_intent import kw_intent_bp
from apps.depth_tool import depth_bp
from apps.utm_tool import utm_bp
from apps.log_tool import log_bp
from apps.ctr_tool import ctr_bp
from apps.roi_tool import roi_bp
from apps.local_nap import nap_bp
from apps.expired_tool import expired_bp
from apps.benchmark_tool import benchmark_bp
from apps.usage_tracker import usage_bp
from apps.ops_cleaner import cleaner_bp
from apps.ops_frameworks import frameworks_bp
from apps.readability_tool import readability_bp
from apps.schema_detector import schema_detector_bp
from apps.autopilot import autopilot_bp
from apps.trends_economy import trends_bp
from apps.project_manager import project_bp, get_active_project
from apps.workflow_tool import workflow_bp
from apps.snippet_tool import snippet_bp
from apps.enhance_tool import enhance_bp
from apps.ai_routes import ai_bp as ai_tools_bp
from apps.api_engine import api_engine_bp

# Portal Auth
from apps.auth_bp import auth_bp
from apps.portal_bp import portal_bp

def create_app(config_class=Config):
    # Inicializar base de datos
    init_db()

    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    app.config.from_object(config_class)

    # --- REGISTRO DE BLUEPRINTS ---
    app.register_blueprint(autopilot_bp)
    app.register_blueprint(entity_bp)
    app.register_blueprint(schema_detector_bp)
    app.register_blueprint(readability_bp)
    app.register_blueprint(seo_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(gap_bp)
    app.register_blueprint(ai_fixer_bp)
    app.register_blueprint(gsc_bp)
    app.register_blueprint(checklist_bp)
    app.register_blueprint(extra_bp)
    app.register_blueprint(nlp_bp)
    app.register_blueprint(eeat_bp)
    app.register_blueprint(graph_bp)
    app.register_blueprint(structure_bp)
    app.register_blueprint(opps_bp)
    app.register_blueprint(intent_bp)
    app.register_blueprint(wpo_bp)
    app.register_blueprint(index_bp)
    app.register_blueprint(redirect_bp)
    app.register_blueprint(local_bp)
    app.register_blueprint(prominence_bp)
    app.register_blueprint(diff_bp)
    app.register_blueprint(suggest_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(meta_gen_bp)
    app.register_blueprint(image_bp)
    app.register_blueprint(bot_bp)
    app.register_blueprint(hreflang_bp)
    app.register_blueprint(extract_bp)
    app.register_blueprint(social_bp)
    app.register_blueprint(schema_bp)
    app.register_blueprint(robots_bp)
    app.register_blueprint(decay_bp)
    app.register_blueprint(indexer_bp)
    app.register_blueprint(migration_bp)
    app.register_blueprint(headers_bp)
    app.register_blueprint(leads_bp)
    app.register_blueprint(duplicate_bp)
    app.register_blueprint(overlap_bp)
    app.register_blueprint(dorks_bp)
    app.register_blueprint(fast_bp)
    app.register_blueprint(tech_bp)
    app.register_blueprint(ratio_bp)
    app.register_blueprint(sculpting_bp)
    app.register_blueprint(draft_bp)
    app.register_blueprint(pixel_bp)
    app.register_blueprint(anchor_bp)
    app.register_blueprint(crawler_bp)
    app.register_blueprint(kw_intent_bp)
    app.register_blueprint(depth_bp)
    app.register_blueprint(utm_bp)
    app.register_blueprint(log_bp)
    app.register_blueprint(ctr_bp)
    app.register_blueprint(roi_bp)
    app.register_blueprint(nap_bp)
    app.register_blueprint(expired_bp)
    app.register_blueprint(benchmark_bp)
    app.register_blueprint(usage_bp)
    app.register_blueprint(cleaner_bp)
    app.register_blueprint(frameworks_bp)
    app.register_blueprint(trends_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(workflow_bp)
    app.register_blueprint(snippet_bp)
    app.register_blueprint(enhance_bp)
    app.register_blueprint(ai_tools_bp)
    app.register_blueprint(api_engine_bp)

    app.register_blueprint(auth_bp)
    app.register_blueprint(portal_bp)

    # --- CONTEXT PROCESSOR ---
    @app.context_processor
    def inject_project():
        return dict(current_project=get_active_project())

    # --- RUTAS GLOBALES ---
    @app.route('/global-status')
    def global_status():
        return jsonify(GLOBAL_STATE)

    @app.route('/monitor/alerts')
    def get_alerts():
        return jsonify(GLOBAL_ALERTS)

    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "ok"})

    @app.route('/')
    def home():
        return render_template('portal.html')

    # Iniciar el vigilante (solo si no estamos testeando, aunque no tenemos flag de testing aun)
    if not app.config.get('TESTING'):
        start_monitor()

    return app
