import copy
import io

import pandas as pd

from apps.web.blueprints import seo_tool
from apps.web.blueprints.seo_tool import job_status, worker


def test_seo_download_returns_400_when_results_have_no_clusters(client):
    previous = copy.deepcopy(job_status)
    try:
        job_status.update({'results': [{'id': 1, 'children': [], 'serp_dump': []}]})

        response = client.get('/seo/download')
        assert response.status_code == 400

        payload = response.get_json()
        assert payload['status'] == 'error'
        assert payload['message'] == 'No hay clusters para exportar; ejecuta Estrategia primero y espera a que finalice.'
    finally:
        job_status.clear()
        job_status.update(previous)


def test_seo_export_e2e_with_100_plus_keywords_generates_non_empty_sheets(client, monkeypatch):
    previous = copy.deepcopy(job_status)

    def fake_dispatcher(keyword, cfg):
        return {
            'status': 'ok',
            'results': [
                {
                    'url': f'https://example.com/{keyword.replace(" ", "-")}',
                    'title': f'Title {keyword}',
                    'rank': 1,
                },
                {
                    'url': f'https://example.com/shared-{hash(keyword) % 7}',
                    'title': f'Shared {keyword}',
                    'rank': 2,
                },
            ],
            'error': None,
            'diagnostics': {'provider': 'fake', 'results_count': 2},
        }

    monkeypatch.setattr(seo_tool, 'dispatcher', fake_dispatcher)

    try:
        keywords = [f'keyword {idx}' for idx in range(1, 121)]
        cfg = {'strict': 3, 'target_domain': 'example.com'}
        worker(keywords, None, cfg)

        response = client.get('/seo/download')
        assert response.status_code == 200

        workbook = io.BytesIO(response.data)
        estrategia_df = pd.read_excel(workbook, sheet_name='Estrategia')
        workbook.seek(0)
        urls_df = pd.read_excel(workbook, sheet_name='URLs')

        assert not estrategia_df.empty
        assert not urls_df.empty
        assert len(estrategia_df) >= 120
    finally:
        job_status.clear()
        job_status.update(previous)
