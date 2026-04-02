import copy
import io

import pandas as pd

from apps.web.blueprints.seo_limits_policy import apply_seo_limits_policy
from apps.web.blueprints.seo_tool import job_status


def test_apply_seo_limits_policy_blocks_invalid_low_topn():
    result = apply_seo_limits_policy(
        top_n=10,
        depth=20,
        max_crawl_pages=3,
        enforcement_mode='block',
        source='test'
    )

    assert result['blocked'] is True
    assert "topN <= 10" in result['block_reason']


def test_apply_seo_limits_policy_autocorrects_low_topn():
    result = apply_seo_limits_policy(
        top_n=8,
        depth=3,
        max_crawl_pages=2,
        enforcement_mode='autocorrect',
        source='test'
    )

    assert result['blocked'] is False
    assert result['depth'] == 10
    assert result['max_crawl_pages'] == 1
    assert result['warnings']


def test_seo_start_blocks_invalid_limits(client):
    response = client.post('/seo/start', data={
        'top_n': '10',
        'depth': '11',
        'max_crawl_pages': '2',
        'keywords': 'keyword test'
    })

    assert response.status_code == 400
    data = response.get_json()
    assert data['status'] == 'error'
    assert 'topN <= 10' in data['message']


def test_seo_start_rejects_invalid_numeric_payload_with_400(client):
    response = client.post('/seo/start', data={
        'top_n': 'abc',
        'depth': '10',
        'max_crawl_pages': '1',
        'keywords': 'keyword test'
    })

    assert response.status_code == 400
    data = response.get_json()
    assert data['status'] == 'error'
    assert "top_n" in data['message']


def test_seo_status_returns_results_with_urls_when_job_finished(client):
    previous = copy.deepcopy(job_status)
    try:
        job_status.update({
            'active': False,
            'progress': 100,
            'current_action': 'Finalizado',
            'logs': [],
            'error': None,
            'results': [
                {
                    'id': 'C1',
                    'parent': 'keyword padre',
                    'children': ['keyword hija'],
                    'serp_dump': [
                        {'rank': 1, 'url': 'https://example.com/a', 'title': 'A'},
                        {'rank': 2, 'url': 'https://example.com/b', 'title': 'B'},
                    ],
                    'urls_set': {'https://example.com/a', 'https://example.com/b'},
                }
            ],
        })

        response = client.get('/seo/status')
        assert response.status_code == 200

        data = response.get_json()
        assert data['results']
        assert data['results'][0]['serp_dump']
        assert data['results'][0]['serp_dump'][0]['url'] == 'https://example.com/a'
        assert 'urls_set' not in data['results'][0]
    finally:
        job_status.clear()
        job_status.update(previous)


def test_seo_download_exports_urls_with_data_regression(client):
    previous = copy.deepcopy(job_status)
    try:
        job_status.update({
            'results': [
                {
                    'id': 'C1',
                    'parent': 'keyword padre',
                    'children': ['keyword hija'],
                    'serp_dump': [
                        {'rank': 1, 'url': 'https://example.com/a', 'title': 'A'},
                        {'rank': 2, 'url': 'https://example.com/b', 'title': 'B'},
                    ],
                    'intent': 'Informacional',
                    'coverage': 'OPPORTUNITY',
                    'own_urls': [],
                }
            ]
        })

        response = client.get('/seo/download')
        assert response.status_code == 200

        workbook = io.BytesIO(response.data)
        workbook_sheets = pd.ExcelFile(workbook).sheet_names
        assert 'Estrategia' in workbook_sheets
        assert 'URLs' in workbook_sheets

        workbook.seek(0)
        estrategia_df = pd.read_excel(workbook, sheet_name='Estrategia')
        assert not estrategia_df.empty
        assert estrategia_df.iloc[0]['Keyword'] == 'keyword padre'

        workbook.seek(0)
        urls_df = pd.read_excel(workbook, sheet_name='URLs')

        assert not urls_df.empty
        assert list(urls_df['URL']) == ['https://example.com/a', 'https://example.com/b']
    finally:
        job_status.clear()
        job_status.update(previous)


def test_seo_download_returns_400_when_no_results(client):
    previous = copy.deepcopy(job_status)
    try:
        job_status.update({'results': []})

        response = client.get('/seo/download')
        assert response.status_code == 400

        data = response.get_json()
        assert data['status'] == 'error'
        assert data['message'] == 'No hay datos recolectados; ejecuta Estrategia primero'
    finally:
        job_status.clear()
        job_status.update(previous)
