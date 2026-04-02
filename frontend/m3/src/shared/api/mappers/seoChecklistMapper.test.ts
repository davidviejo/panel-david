import { describe, expect, it } from 'vitest';
import { CHECKLIST_POINTS, ChecklistItem, ChecklistKey, SeoPage } from '../../../types/seoChecklist';
import { normalizeChecklist, normalizeSeoPages } from './seoChecklistMapper';

const buildChecklist = (overrides: Partial<Record<ChecklistKey, ChecklistItem>> = {}) => {
  const checklist: Partial<Record<ChecklistKey, ChecklistItem>> = {};

  CHECKLIST_POINTS.forEach((point) => {
    checklist[point.key] = {
      key: point.key,
      label: point.label,
      status_manual: 'NA',
      notes_manual: '',
    };
  });

  return {
    ...checklist,
    ...overrides,
  } as Record<ChecklistKey, ChecklistItem>;
};

const buildPage = (overrides: Partial<SeoPage> = {}): SeoPage => ({
  id: overrides.id || crypto.randomUUID(),
  url: overrides.url || 'https://example.com',
  kwPrincipal: overrides.kwPrincipal || '',
  pageType: overrides.pageType || 'Article',
  checklist: overrides.checklist || buildChecklist(),
  ...overrides,
});

describe('seoChecklistMapper', () => {
  it('normalizes legacy status aliases while keeping known checklist keys', () => {
    const normalized = normalizeChecklist({
      SNIPPETS: {
        key: 'SNIPPETS',
        label: '5. Snippets',
        status_manual: 'Si (IA)' as ChecklistItem['status_manual'],
        notes_manual: 'legacy status alias',
      },
    });

    expect(normalized.SNIPPETS.status_manual).toBe('SI_IA');
    expect(normalized.CLUSTER.status_manual).toBe('NA');
    expect(Object.keys(normalized)).toHaveLength(CHECKLIST_POINTS.length);
  });

  it('normalizes every page in the list with default checklist payload', () => {
    const pages = [
      buildPage({
        id: 'page-1',
        checklist: {
          SNIPPETS: {
            key: 'SNIPPETS',
            label: '5. Snippets',
            status_manual: 'N/A' as ChecklistItem['status_manual'],
            notes_manual: '',
          },
        } as Record<ChecklistKey, ChecklistItem>,
      }),
    ];

    const normalizedPages = normalizeSeoPages(pages);

    expect(normalizedPages).toHaveLength(1);
    expect(normalizedPages[0].checklist.SNIPPETS.status_manual).toBe('NA');
    expect(normalizedPages[0].checklist.CTA.status_manual).toBe('NA');
  });
});
