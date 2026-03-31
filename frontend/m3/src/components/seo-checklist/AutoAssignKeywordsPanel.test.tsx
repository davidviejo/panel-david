import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutoAssignKeywordsPanel } from './AutoAssignKeywordsPanel';

vi.mock('../../services/clientRepository', () => ({
  ClientRepository: {
    getCurrentClientId: () => 'client-test',
  },
}));

describe('AutoAssignKeywordsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('excluye keywords de marca y no repite KW principal en propuestas', () => {
    localStorage.setItem(
      'mediaflow_seo_settings_client-test',
      JSON.stringify({
        brandTerms: ['nike'],
      }),
    );

    const pages: any[] = [
      {
        id: 'page-1',
        url: 'https://site.test/a',
        kwPrincipal: 'zapatillas running',
        isBrandKeyword: false,
        checklist: {
          OPORTUNIDADES: {
            autoData: {
              gscQueries: [
                { query: 'zapatillas running', clicks: 10, impressions: 100, position: 2 },
              ],
            },
          },
        },
      },
      {
        id: 'page-2',
        url: 'https://site.test/b',
        kwPrincipal: '',
        isBrandKeyword: false,
        checklist: {
          OPORTUNIDADES: {
            autoData: {
              gscQueries: [
                { query: 'nike hombre', clicks: 50, impressions: 200, position: 1 },
                { query: 'zapatillas running', clicks: 40, impressions: 180, position: 1.2 },
                { query: 'zapatillas trail', clicks: 30, impressions: 170, position: 1.5 },
              ],
            },
          },
        },
      },
    ];

    render(<AutoAssignKeywordsPanel pages={pages} onBulkUpdate={vi.fn()} />);

    expect(screen.getByText('zapatillas trail')).toBeTruthy();
    expect(screen.queryByText('nike hombre')).toBeNull();
  });
});
