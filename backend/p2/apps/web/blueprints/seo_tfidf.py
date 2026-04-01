from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from uuid import uuid4

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from apps.models.seo_tfidf import (
    AddDocumentsRequest,
    AddDocumentsResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    CreateProjectRequest,
    CreateProjectResponse,
    ListProjectsResponse,
    ListRunsResponse,
    ProjectListItem,
    RunDetailResponse,
    RunListItem,
    TermScore,
)

seo_tfidf_bp = Blueprint('seo_tfidf', __name__, url_prefix='/seo_tfidf')

_PROJECTS: dict[str, dict] = {}
_RUNS: dict[str, dict] = {}


def _json_validation_error(exc: ValidationError):
    details = []
    for err in exc.errors():
        loc = '.'.join(str(part) for part in err.get('loc', ()))
        details.append({'field': loc, 'message': err.get('msg', 'Invalid value')})
    return jsonify({'error': {'code': 'validation_error', 'details': details}}), 400


def _json_4xx(code: str, message: str, status: int = 400):
    return jsonify({'error': {'code': code, 'message': message}}), status


@seo_tfidf_bp.route('/projects', methods=['POST'])
def create_project():
    try:
        payload = CreateProjectRequest.model_validate(request.get_json(silent=True) or {})
    except ValidationError as exc:
        return _json_validation_error(exc)

    project_id = f'proj_{uuid4().hex[:10]}'
    created_at = datetime.now(timezone.utc)
    _PROJECTS[project_id] = {
        'project_id': project_id,
        'name': payload.name,
        'description': payload.description,
        'created_at': created_at,
        'documents': [],
    }

    response = CreateProjectResponse(
        project_id=project_id,
        name=payload.name,
        description=payload.description,
        created_at=created_at,
    )
    return jsonify(response.model_dump(mode='json')), 201


@seo_tfidf_bp.route('/projects', methods=['GET'])
def list_projects():
    projects = [
        ProjectListItem(
            project_id=project['project_id'],
            name=project['name'],
            description=project.get('description'),
            document_count=len(project.get('documents', [])),
            created_at=project['created_at'],
        )
        for project in _PROJECTS.values()
    ]
    return jsonify(ListProjectsResponse(projects=projects).model_dump(mode='json'))


@seo_tfidf_bp.route('/documents', methods=['POST'])
def add_documents():
    try:
        payload = AddDocumentsRequest.model_validate(request.get_json(silent=True) or {})
    except ValidationError as exc:
        return _json_validation_error(exc)

    project = _PROJECTS.get(payload.project_id)
    if not project:
        return _json_4xx('project_not_found', 'Project not found.', status=404)

    normalized_urls = [str(url) for url in payload.urls]
    previous = set(project['documents'])
    previous_count = len(previous)
    previous.update(normalized_urls)
    project['documents'] = sorted(previous)

    response = AddDocumentsResponse(
        project_id=payload.project_id,
        added_count=len(project['documents']) - previous_count,
        total_count=len(project['documents']),
    )
    return jsonify(response.model_dump(mode='json')), 201


@seo_tfidf_bp.route('/analyze', methods=['POST'])
def analyze():
    try:
        payload = AnalyzeRequest.model_validate(request.get_json(silent=True) or {})
    except ValidationError as exc:
        return _json_validation_error(exc)

    unique_reference_urls = sorted({str(url) for url in payload.reference_urls})
    if len(unique_reference_urls) < 2:
        return _json_4xx('insufficient_corpus', 'Corpus insuficiente: se requieren al menos 2 URLs de referencia.')

    url_tokens = ' '.join(unique_reference_urls).replace('/', ' ').replace('.', ' ').replace('-', ' ').lower().split()
    term_counts = Counter(token for token in url_tokens if len(token) > 2)
    if len(term_counts) < 3:
        return _json_4xx('insufficient_corpus', 'Corpus insuficiente: no hay suficiente variedad semántica.')

    top_terms = [
        TermScore(term=term, score=float(score))
        for term, score in term_counts.most_common(15)
    ]
    run_id = f'run_{uuid4().hex[:12]}'
    created_at = datetime.now(timezone.utc)
    summary = {
        'reference_count': len(unique_reference_urls),
        'unique_terms': len(term_counts),
        'config': payload.tfidf.model_dump(mode='python'),
    }
    recommendations = [
        'Incluir términos dominantes en H1/H2 de la URL objetivo.',
        'Reforzar cobertura semántica en FAQ y secciones de soporte.',
        'Comparar términos faltantes frente al contenido actual.',
    ]

    run_detail = RunDetailResponse(
        run_id=run_id,
        status='completed',
        target_url=payload.target_url,
        reference_urls=payload.reference_urls,
        tfidf=payload.tfidf,
        summary=summary,
        recommendations=recommendations,
        terms=top_terms,
        created_at=created_at,
    )
    _RUNS[run_id] = run_detail.model_dump(mode='json')

    response = AnalyzeResponse(
        run_id=run_id,
        summary=summary,
        recommendations=recommendations,
        terms=top_terms,
    )
    return jsonify(response.model_dump(mode='json')), 200


@seo_tfidf_bp.route('/runs', methods=['GET'])
def list_runs():
    runs = [
        RunListItem(
            run_id=run['run_id'],
            status=run['status'],
            target_url=run['target_url'],
            created_at=run['created_at'],
        )
        for run in _RUNS.values()
    ]
    return jsonify(ListRunsResponse(runs=runs).model_dump(mode='json'))


@seo_tfidf_bp.route('/runs/<run_id>', methods=['GET'])
def run_detail(run_id: str):
    run = _RUNS.get(run_id)
    if not run:
        return _json_4xx('run_not_found', 'Run not found.', status=404)

    response = RunDetailResponse.model_validate(run)
    return jsonify(response.model_dump(mode='json'))
