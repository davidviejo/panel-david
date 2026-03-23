import { describe, expect, it } from 'vitest';
import { enforceUniquePrimaryKeywords } from './useSeoChecklist';
import { SeoPage, CHECKLIST_POINTS, ChecklistItem, ChecklistKey } from '../types/seoChecklist';

const buildChecklist = () => {
  const checklist: Record<string, ChecklistItem> = {};
  CHECKLIST_POINTS.forEach((pt) => {
    checklist[pt.key] = {
      key: pt.key,
      label: pt.label,
      status_manual: 'NA',
      notes_manual: '',
    };
  });

  return checklist as Record<ChecklistKey, ChecklistItem>;
};

const buildPage = (overrides: Partial<SeoPage>): SeoPage => ({
  id: overrides.id || crypto.randomUUID(),
  url: overrides.url || 'https://example.com',
  kwPrincipal: overrides.kwPrincipal || '',
  pageType: overrides.pageType || 'Article',
  checklist: overrides.checklist || buildChecklist(),
  ...overrides,
});

describe('enforceUniquePrimaryKeywords', () => {
  it('keeps the duplicated keyword only on the highest-performing URL', () => {
    const pages = [
      buildPage({
        id: 'page-a',
        url: 'https://example.com/a',
        kwPrincipal: 'kw compartida',
        gscMetrics: { clicks: 10, impressions: 100, ctr: 0.1, position: 4 },
      }),
      buildPage({
        id: 'page-b',
        url: 'https://example.com/b',
        kwPrincipal: 'kw compartida',
        gscMetrics: { clicks: 25, impressions: 80, ctr: 0.3125, position: 3 },
      }),
      buildPage({
        id: 'page-c',
        url: 'https://example.com/c',
        kwPrincipal: 'otra kw',
        gscMetrics: { clicks: 5, impressions: 50, ctr: 0.1, position: 6 },
      }),
    ];

    const result = enforceUniquePrimaryKeywords(pages);

    expect(result.find((page) => page.id === 'page-b')?.kwPrincipal).toBe('kw compartida');
    expect(result.find((page) => page.id === 'page-a')?.kwPrincipal).toBe('');
    expect(result.find((page) => page.id === 'page-c')?.kwPrincipal).toBe('otra kw');
  });
});
