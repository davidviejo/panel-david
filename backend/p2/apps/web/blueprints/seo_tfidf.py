from collections import Counter
from datetime import datetime
from math import log
from threading import Lock
import re
import uuid

from flask import Blueprint, jsonify

from apps.tools.utils import safe_get_json

seo_tfidf_bp = Blueprint('seo_tfidf_bp', __name__, url_prefix='/api/seo/tfidf')
seo_tfidf_v1_bp = Blueprint('seo_tfidf_v1_bp', __name__, url_prefix='/api/v1/seo/tfidf')

_WORD_RE = re.compile(r"[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]+")
_PROJECTS = {}
_RUNS = {}
_LOCK = Lock()


def _utc_now_iso() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def _tokenize(text: str):
    return [match.group(0).lower() for match in _WORD_RE.finditer(text or '')]


def _compute_tfidf(documents):
    tokenized_docs = [_tokenize(doc.get('content', '')) for doc in documents]
    total_docs = len(tokenized_docs)
    if total_docs == 0:
        return []

    doc_freq = Counter()
    for tokens in tokenized_docs:
        doc_freq.update(set(tokens))

    analysis = []
    for index, doc in enumerate(documents):
        tokens = tokenized_docs[index]
        if not tokens:
            analysis.append({
                'document_id': doc['id'],
                'top_terms': [],
                'token_count': 0,
            })
            continue

        term_freq = Counter(tokens)
        token_count = len(tokens)
        scores = []
        for term, freq in term_freq.items():
            tf = freq / token_count
            idf = log((1 + total_docs) / (1 + doc_freq[term])) + 1
            score = tf * idf
            scores.append({
                'term': term,
                'tf': round(tf, 6),
                'idf': round(idf, 6),
                'score': round(score, 6),
                'frequency': freq,
            })

        scores.sort(key=lambda item: item['score'], reverse=True)
        analysis.append({
            'document_id': doc['id'],
            'token_count': token_count,
            'top_terms': scores[:25],
        })

    return analysis


@seo_tfidf_bp.route('/projects', methods=['POST'])
@seo_tfidf_v1_bp.route('/projects', methods=['POST'])
def create_project():
    data = safe_get_json()
    name = str(data.get('name', '')).strip() or 'Untitled TF-IDF Project'

    project_id = str(uuid.uuid4())
    project = {
        'id': project_id,
        'name': name,
        'created_at': _utc_now_iso(),
        'updated_at': _utc_now_iso(),
        'documents': [],
        'runs': [],
    }

    with _LOCK:
        _PROJECTS[project_id] = project

    return jsonify(project), 201


@seo_tfidf_bp.route('/projects/<project_id>/documents', methods=['POST'])
@seo_tfidf_v1_bp.route('/projects/<project_id>/documents', methods=['POST'])
def add_documents(project_id):
    data = safe_get_json()
    documents = data.get('documents')

    if not isinstance(documents, list) or not documents:
        return jsonify({'error': 'Debes enviar una lista no vacía en "documents".'}), 400

    with _LOCK:
        project = _PROJECTS.get(project_id)
        if not project:
            return jsonify({'error': 'Proyecto no encontrado.'}), 404

        inserted = []
        for entry in documents:
            if not isinstance(entry, dict):
                continue
            content = str(entry.get('content', '')).strip()
            if not content:
                continue

            document = {
                'id': str(uuid.uuid4()),
                'title': str(entry.get('title', '')).strip() or 'Documento sin título',
                'content': content,
                'created_at': _utc_now_iso(),
            }
            project['documents'].append(document)
            inserted.append(document)

        project['updated_at'] = _utc_now_iso()

    return jsonify({'project_id': project_id, 'inserted': inserted, 'count': len(inserted)}), 201


@seo_tfidf_bp.route('/projects/<project_id>/analyze', methods=['POST'])
@seo_tfidf_v1_bp.route('/projects/<project_id>/analyze', methods=['POST'])
def analyze_project(project_id):
    with _LOCK:
        project = _PROJECTS.get(project_id)
        if not project:
            return jsonify({'error': 'Proyecto no encontrado.'}), 404

        if not project['documents']:
            return jsonify({'error': 'El proyecto no tiene documentos para analizar.'}), 400

        run_id = str(uuid.uuid4())
        result = {
            'run_id': run_id,
            'project_id': project_id,
            'status': 'completed',
            'created_at': _utc_now_iso(),
            'documents_analyzed': len(project['documents']),
            'analysis': _compute_tfidf(project['documents']),
        }
        _RUNS[run_id] = result
        project['runs'].append(run_id)
        project['updated_at'] = _utc_now_iso()

    return jsonify(result), 202


@seo_tfidf_bp.route('/runs/<run_id>', methods=['GET'])
@seo_tfidf_v1_bp.route('/runs/<run_id>', methods=['GET'])
def get_run(run_id):
    with _LOCK:
        run = _RUNS.get(run_id)

    if not run:
        return jsonify({'error': 'Run no encontrado.'}), 404

    return jsonify(run)


@seo_tfidf_bp.route('/projects', methods=['GET'])
@seo_tfidf_v1_bp.route('/projects', methods=['GET'])
def list_projects():
    with _LOCK:
        projects = [
            {
                'id': project['id'],
                'name': project['name'],
                'created_at': project['created_at'],
                'updated_at': project['updated_at'],
                'documents_count': len(project['documents']),
                'runs_count': len(project['runs']),
            }
            for project in _PROJECTS.values()
        ]

    return jsonify({'projects': projects, 'count': len(projects)})


@seo_tfidf_bp.route('/projects/<project_id>/runs', methods=['GET'])
@seo_tfidf_v1_bp.route('/projects/<project_id>/runs', methods=['GET'])
def list_project_runs(project_id):
    with _LOCK:
        project = _PROJECTS.get(project_id)
        if not project:
            return jsonify({'error': 'Proyecto no encontrado.'}), 404

        runs = [_RUNS[run_id] for run_id in project['runs'] if run_id in _RUNS]

    return jsonify({'project_id': project_id, 'runs': runs, 'count': len(runs)})
