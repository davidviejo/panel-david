import { describe, it, expect } from 'vitest';
import { processAnalysisResult } from './seoUtils';
import { SeoPage, ChecklistItem } from '../types/seoChecklist';

describe('processAnalysisResult', () => {
  const mockPage: SeoPage = {
    id: 'page-1',
    url: 'https://example.com',
    kwPrincipal: 'test',
    pageType: 'Article',
    checklist: {
      OPORTUNIDADES: {
        key: 'OPORTUNIDADES',
        label: 'Ops',
        status_manual: 'SI',
        notes_manual: 'Manual note',
        autoData: {},
      } as ChecklistItem,
      DATOS_ESTRUCTURADOS: {
        key: 'DATOS_ESTRUCTURADOS',
        label: 'Data',
        status_manual: 'NA',
        notes_manual: '',
      } as ChecklistItem,
    } as any,
  };

  it('should merge autoData and preserve manual status', () => {
    const result = {
      pageId: 'page-1',
      items: {
        OPORTUNIDADES: {
          autoData: { newField: 123 },
          recommendation: 'Fix this',
          suggested_status: 'NO',
        },
      },
    };

    const updates = processAnalysisResult(mockPage, result);

    expect(updates.checklist?.OPORTUNIDADES.status_manual).toBe('SI');
    expect(updates.checklist?.OPORTUNIDADES.notes_manual).toBe('Manual note');
    expect(updates.checklist?.OPORTUNIDADES.autoData.newField).toBe(123);
    expect(updates.checklist?.OPORTUNIDADES.recommendation).toBe('Fix this');
    expect(updates.checklist?.OPORTUNIDADES.suggested_status).toBe('NO');
  });

  it('should expose the primary keyword in oportunidades autoData even without GSC data', () => {
    const updates = processAnalysisResult(mockPage, { pageId: 'page-1', items: {} }, []);

    expect(updates.checklist?.OPORTUNIDADES.autoData.primaryKeyword).toBe('test');
    expect(updates.checklist?.OPORTUNIDADES.autoData.isBrandKeyword).toBe(false);
    expect(updates.checklist?.OPORTUNIDADES.autoData.kwPrincipalInGSC).toBeUndefined();
  });

  it('should assign a non-brand primary keyword from GSC when the page has none', () => {
    const pageWithoutKeyword: SeoPage = {
      ...mockPage,
      kwPrincipal: '',
    };
    const gscQueries = [
      {
        keys: ['brand kw'],
        query: 'brand kw',
        clicks: 100,
        impressions: 200,
        ctr: 0.5,
        position: 1,
      },
      {
        keys: ['seo checklist'],
        query: 'seo checklist',
        clicks: 25,
        impressions: 150,
        ctr: 0.16,
        position: 2,
      },
    ];

    localStorage.setItem(
      'mediaflow_seo_settings_test',
      JSON.stringify({ brandTerms: ['brand kw'] }),
    );

    const updates = processAnalysisResult(
      pageWithoutKeyword,
      { pageId: 'page-1', items: {} },
      gscQueries,
    );

    expect(updates.kwPrincipal).toBe('seo checklist');
    expect(updates.originalKwPrincipal).toBe('seo checklist');
    expect(updates.checklist?.OPORTUNIDADES.autoData.primaryKeyword).toBe('seo checklist');
  });

  it('should never assign a brand keyword as primary keyword from GSC', () => {
    const pageWithoutKeyword: SeoPage = {
      ...mockPage,
      kwPrincipal: '',
    };
    const gscQueries = [
      {
        keys: ['brand kw'],
        query: 'brand kw',
        clicks: 100,
        impressions: 200,
        ctr: 0.5,
        position: 1,
      },
    ];

    localStorage.setItem(
      'mediaflow_seo_settings_test',
      JSON.stringify({ brandTerms: ['brand kw'] }),
    );

    const updates = processAnalysisResult(
      pageWithoutKeyword,
      { pageId: 'page-1', items: {} },
      gscQueries,
    );

    expect(updates.kwPrincipal).toBe('');
    expect(updates.checklist?.OPORTUNIDADES.autoData.primaryKeyword).toBe('');
  });


  it('should treat a keyword containing a configured brand term as brand', () => {
    const pageWithoutKeyword: SeoPage = {
      ...mockPage,
      kwPrincipal: '',
    };
    const gscQueries = [
      {
        keys: ['zara vestidos fiesta'],
        query: 'zara vestidos fiesta',
        clicks: 100,
        impressions: 200,
        ctr: 0.5,
        position: 1,
      },
      {
        keys: ['vestidos fiesta'],
        query: 'vestidos fiesta',
        clicks: 25,
        impressions: 150,
        ctr: 0.16,
        position: 2,
      },
    ];

    localStorage.setItem(
      'mediaflow_seo_settings_test',
      JSON.stringify({ brandTerms: ['zara'] }),
    );

    const updates = processAnalysisResult(
      pageWithoutKeyword,
      { pageId: 'page-1', items: {} },
      gscQueries,
    );

    expect(updates.kwPrincipal).toBe('vestidos fiesta');
    expect(updates.checklist?.OPORTUNIDADES.autoData.primaryKeyword).toBe('vestidos fiesta');
  });


  it('should keep current primary keyword when updating KW principal is disabled', () => {
    const gscQueries = [
      {
        keys: ['better kw'],
        query: 'better kw',
        clicks: 999,
        impressions: 1200,
        ctr: 0.8,
        position: 1,
      },
    ];

    localStorage.setItem(
      'mediaflow_seo_settings_test',
      JSON.stringify({ allowKwPrincipalUpdate: false, brandTerms: [] }),
    );

    const updates = processAnalysisResult(mockPage, { pageId: 'page-1', items: {} }, gscQueries);

    expect(updates.kwPrincipal).toBe('test');
    expect(updates.checklist?.OPORTUNIDADES.autoData.primaryKeyword).toBe('test');

    localStorage.removeItem('mediaflow_seo_settings_test');
  });

  it('should inject GSC queries if provided', () => {
    const gscQueries = [{ keys: ['test'], clicks: 10 }];
    const result = {
      pageId: 'page-1',
      items: {},
    };

    const updates = processAnalysisResult(mockPage, result, gscQueries);

    expect(updates.checklist?.OPORTUNIDADES.autoData.gscQueries).toEqual([
      expect.objectContaining({ keys: ['test'], query: 'test', clicks: 10 }),
    ]);
    expect(updates.checklist?.OPORTUNIDADES.autoData.kwPrincipalInGSC).toBe(true);
  });

  it('should not overwrite existing GSC queries in result if no new queries provided', () => {
    const result = {
      pageId: 'page-1',
      items: {
        OPORTUNIDADES: {
          autoData: {
            gscQueries: [{ keys: ['existing'], clicks: 5 }],
          },
        },
      },
    };

    const updates = processAnalysisResult(mockPage, result);

    expect(updates.checklist?.OPORTUNIDADES.autoData.gscQueries[0].keys[0]).toBe('existing');
  });

  it('should assign a non-brand primary keyword when the current value is a dash placeholder', () => {
    const pageWithoutKeyword: SeoPage = {
      ...mockPage,
      kwPrincipal: '-',
    };
    const gscQueries = [
      { keys: ['secondary kw'], clicks: 5, impressions: 100, ctr: 0.05, position: 4 },
      { keys: ['best kw'], clicks: 12, impressions: 80, ctr: 0.15, position: 3 },
    ];

    const updates = processAnalysisResult(
      pageWithoutKeyword,
      { pageId: 'page-1', items: {} },
      gscQueries,
    );

    expect(updates.kwPrincipal).toBe('best kw');
    expect(updates.originalKwPrincipal).toBe('best kw');
  });

  it('should store exact page GSC metrics when they are provided', () => {
    const gscMetrics = {
      clicks: 34,
      impressions: 456,
      ctr: 34 / 456,
      position: 7.2,
      source: 'page' as const,
    };

    const updates = processAnalysisResult(
      mockPage,
      { pageId: 'page-1', items: {} },
      [],
      gscMetrics,
    );

    expect(updates.gscMetrics).toEqual(expect.objectContaining(gscMetrics));
  });

  it('should sync LocalBusiness from DATOS_ESTRUCTURADOS to GEOLOCALIZACION when @type is a string', () => {
    const result = {
      pageId: 'page-1',
      items: {
        DATOS_ESTRUCTURADOS: {
          autoData: {
            schemasParsed: [{ '@type': 'LocalBusiness' }],
          },
        },
      },
    };

    const updates = processAnalysisResult(mockPage, result);
    expect(updates.checklist?.GEOLOCALIZACION?.autoData?.localBusiness).toBe(true);
  });

  it('should sync LocalBusiness from DATOS_ESTRUCTURADOS to GEOLOCALIZACION when @type is an array', () => {
    const result = {
      pageId: 'page-1',
      items: {
        DATOS_ESTRUCTURADOS: {
          autoData: {
            schemasParsed: [{ '@type': ['Store', 'LocalBusiness'] }],
          },
        },
      },
    };

    const updates = processAnalysisResult(mockPage, result);
    expect(updates.checklist?.GEOLOCALIZACION?.autoData?.localBusiness).toBe(true);
  });

  it('should not sync LocalBusiness if it is not present in DATOS_ESTRUCTURADOS', () => {
    const result = {
      pageId: 'page-1',
      items: {
        DATOS_ESTRUCTURADOS: {
          autoData: {
            schemasParsed: [{ '@type': 'Article' }],
          },
        },
      },
    };

    const updates = processAnalysisResult(mockPage, result);
    expect(updates.checklist?.GEOLOCALIZACION?.autoData?.localBusiness).toBeUndefined();
  });
});
