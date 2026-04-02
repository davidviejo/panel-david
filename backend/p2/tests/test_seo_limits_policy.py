from apps.web.blueprints.seo_limits_policy import apply_seo_limits_policy


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
