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
        autoData: {}
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
          suggested_status: 'NO'
        }
      }
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
      items: {}
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
            gscQueries: [{ keys: ['existing'], clicks: 5 }]
          }
        }
      }
    };

    const updates = processAnalysisResult(mockPage, result);

    expect(updates.checklist?.OPORTUNIDADES.autoData.gscQueries[0].keys[0]).toBe('existing');
  });
});
