import React, { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SeoPage } from '../../types/seoChecklist';

type KeywordSourceMode = 'all' | 'with_gsc' | 'without_kw';

interface KeywordProposal {
  id: string;
  url: string;
  currentKeyword: string;
  proposedKeyword: string;
  confidence: 'alta' | 'media' | 'baja';
  reason: string;
  gscClicks: number;
  gscImpressions: number;
}

interface Props {
  pages: SeoPage[];
  onBulkUpdate: (updates: { id: string; changes: Partial<SeoPage> }[]) => void;
}

const isUsableKeyword = (value?: string) => {
  const normalized = (value || '').trim();
  return normalized.length > 0 && normalized !== '-';
};

const normalizeQueryRow = (row: any) => {
  const query = row?.query || row?.keys?.[0] || '';
  return {
    ...row,
    query,
    clicks: Number(row?.clicks || 0),
    impressions: Number(row?.impressions || 0),
    position: Number(row?.position || Number.POSITIVE_INFINITY),
  };
};

const getBestKeywordFromPage = (page: SeoPage) => {
  const rawQueries = page.checklist.OPORTUNIDADES?.autoData?.gscQueries;
  if (!Array.isArray(rawQueries) || rawQueries.length === 0) {
    return null;
  }

  const sorted = rawQueries
    .map(normalizeQueryRow)
    .filter((query: any) => isUsableKeyword(query.query))
    .sort((a: any, b: any) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      if (b.impressions !== a.impressions) return b.impressions - a.impressions;
      return a.position - b.position;
    });

  if (sorted.length === 0) return null;
  const best = sorted[0];
  return {
    keyword: best.query.trim(),
    clicks: best.clicks,
    impressions: best.impressions,
  };
};

export const AutoAssignKeywordsPanel: React.FC<Props> = ({ pages, onBulkUpdate }) => {
  const [sourceMode, setSourceMode] = useState<KeywordSourceMode>('without_kw');
  const [status, setStatus] = useState('');

  const proposals = useMemo<KeywordProposal[]>(() => {
    return pages
      .filter((page) => {
        if (sourceMode === 'with_gsc') {
          return (page.gscMetrics?.queryCount || 0) > 0;
        }
        if (sourceMode === 'without_kw') {
          return !isUsableKeyword(page.kwPrincipal);
        }
        return true;
      })
      .map((page) => {
        const currentKeyword = (page.kwPrincipal || '').trim();
        const suggestion = getBestKeywordFromPage(page);

        if (page.isBrandKeyword) {
          return {
            id: page.id,
            url: page.url,
            currentKeyword,
            proposedKeyword: '',
            confidence: 'baja' as const,
            reason: 'URL marcada como keyword de marca; se omite autoasignación.',
            gscClicks: 0,
            gscImpressions: 0,
          };
        }

        if (!suggestion) {
          return {
            id: page.id,
            url: page.url,
            currentKeyword,
            proposedKeyword: '',
            confidence: 'baja' as const,
            reason: 'Sin queries GSC disponibles en Oportunidades para proponer keyword.',
            gscClicks: 0,
            gscImpressions: 0,
          };
        }

        const confidence: KeywordProposal['confidence'] =
          suggestion.clicks >= 10 || suggestion.impressions >= 200
            ? 'alta'
            : suggestion.clicks >= 3 || suggestion.impressions >= 75
              ? 'media'
              : 'baja';

        return {
          id: page.id,
          url: page.url,
          currentKeyword,
          proposedKeyword: suggestion.keyword,
          confidence,
          reason:
            currentKeyword.toLowerCase() === suggestion.keyword.toLowerCase()
              ? 'La keyword actual ya coincide con la mejor query de GSC.'
              : 'Keyword sugerida desde la query con mejor rendimiento (clics/impresiones).',
          gscClicks: suggestion.clicks,
          gscImpressions: suggestion.impressions,
        };
      })
      .filter((proposal) => proposal.proposedKeyword);
  }, [pages, sourceMode]);

  const applyKeywordAssignments = () => {
    const updates = proposals
      .filter(
        (proposal) =>
          proposal.proposedKeyword &&
          proposal.proposedKeyword.toLowerCase() !== proposal.currentKeyword.toLowerCase(),
      )
      .map((proposal) => ({
        id: proposal.id,
        changes: {
          kwPrincipal: proposal.proposedKeyword,
          isBrandKeyword: false,
        },
      }));

    if (updates.length === 0) {
      setStatus('No hay cambios para aplicar: todas las keywords ya estaban asignadas.');
      return;
    }

    onBulkUpdate(updates);
    setStatus(`Autoasignación aplicada: ${updates.length} URLs actualizadas con nueva KW principal.`);
  };

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Autoasignación de KWs</h2>
        <p className="text-sm text-slate-600">
          Propone y asigna solo keywords principales usando las queries disponibles de GSC.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Fuente</label>
          <select
            value={sourceMode}
            onChange={(event) => setSourceMode(event.target.value as KeywordSourceMode)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="without_kw">Solo URLs sin KW principal</option>
            <option value="with_gsc">Solo URLs con datos de GSC</option>
            <option value="all">Todas las URLs</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={applyKeywordAssignments} disabled={proposals.length === 0}>
          Aprobar y pasar a Análisis SEO y Clusters
        </Button>
      </div>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">KW actual</th>
              <th className="px-3 py-2">KW propuesta</th>
              <th className="px-3 py-2">Confianza</th>
              <th className="px-3 py-2">Datos GSC</th>
              <th className="px-3 py-2">Justificación</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((proposal) => (
              <tr key={proposal.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-xs text-slate-700">{proposal.url}</td>
                <td className="px-3 py-2 text-slate-600">{proposal.currentKeyword || '-'}</td>
                <td className="px-3 py-2 font-medium text-slate-900">{proposal.proposedKeyword}</td>
                <td className="px-3 py-2 capitalize text-slate-600">{proposal.confidence}</td>
                <td className="px-3 py-2 text-slate-600">
                  {proposal.gscClicks} clics / {proposal.gscImpressions} imp.
                </td>
                <td className="px-3 py-2 text-slate-600">{proposal.reason}</td>
              </tr>
            ))}
            {proposals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  No hay propuestas de keyword con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
