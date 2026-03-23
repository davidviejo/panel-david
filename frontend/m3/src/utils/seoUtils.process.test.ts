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

  it('should inject GSC queries if provided', () => {
    const gscQueries = [{ keys: ['test'], clicks: 10 }];
    const result = {
      pageId: 'page-1',
      items: {},
    };

    const updates = processAnalysisResult(mockPage, result, gscQueries);

    expect(updates.checklist?.OPORTUNIDADES.autoData.gscQueries).toEqual(gscQueries);
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

  it('should infer the primary keyword from GSC when the current keyword is missing', () => {
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
  });

  it('should exclude brand-term queries when inferring the primary keyword from GSC', () => {
    const pageWithoutKeyword: SeoPage = {
      ...mockPage,
      kwPrincipal: '-',
      brandTerms: ['brand', 'brand pro'],
    };
    const gscQueries = [
      { keys: ['brand login'], clicks: 40, impressions: 500, ctr: 0.08, position: 1.2 },
      { keys: ['brand pro pricing'], clicks: 22, impressions: 300, ctr: 0.07, position: 2.4 },
      { keys: ['running shoes women'], clicks: 12, impressions: 180, ctr: 0.06, position: 3.1 },
    ];

    const updates = processAnalysisResult(
      pageWithoutKeyword,
      { pageId: 'page-1', items: {} },
      gscQueries,
    );

    expect(updates.kwPrincipal).toBe('running shoes women');
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
