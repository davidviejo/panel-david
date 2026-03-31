import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Filter, History, Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../context/ProjectContext';
import { IAVisibilityResponse, iaVisibilityService } from '../services/iaVisibilityService';
import { HttpClientError } from '../services/httpClient';

type VisibilityStatus = 'up' | 'stable' | 'down';

interface VisibilityRow {
  id: string;
  keyword: string;
  url: string;
  position: number;
  change: number;
  status: VisibilityStatus;
}

const buildRowsFromRuns = (runs: IAVisibilityResponse[]): VisibilityRow[] => {
  return runs.flatMap((run, runIndex) => {
    const evidence = Array.isArray(run.rawEvidence) ? run.rawEvidence : [];
    return evidence.map((item, evidenceIndex) => {
      const summary = String(item.summary || item.source || `Consulta ${evidenceIndex + 1}`);
      const score = Number(item.score ?? 0);
      const position = Math.max(1, Math.min(100, Math.round(100 - Math.max(score, 0))));
      const status: VisibilityStatus = score > 60 ? 'up' : score >= 30 ? 'stable' : 'down';
      return {
        id: `${run.clientId}-${runIndex}-${evidenceIndex}`,
        keyword: summary,
        url: String(item.source || '-'),
        position,
        change: Math.round(score - 50),
        status,
      };
    });
  });
};

const IAVisibility: React.FC = () => {
  const { t } = useTranslation();
  const { clients = [], currentClientId, switchClient, currentClient } = useProject();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VisibilityStatus>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<IAVisibilityResponse[]>([]);

  const rows = useMemo(() => buildRowsFromRuns(runs), [runs]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery =
        !query ||
        row.keyword.toLowerCase().includes(query.toLowerCase()) ||
        row.url.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!currentClientId) {
        setRuns([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await iaVisibilityService.getHistory(currentClientId);
        setRuns(result.runs || []);
      } catch (err) {
        const message = err instanceof HttpClientError ? err.message : 'No se pudo cargar el historial.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [currentClientId]);

  const handleRun = async () => {
    if (!currentClientId || !currentClient) return;

    setIsRunning(true);
    setError(null);
    try {
      const payload = {
        clientId: currentClientId,
        brand: currentClient.name,
        competitors: currentClient.iaVisibility?.config.competitors || [],
        promptTemplate:
          currentClient.iaVisibility?.config.objective ||
          'Evalúa visibilidad IA de marca y competidores para fuentes digitales.',
        sources: currentClient.iaVisibility?.config.prompts || ['google', 'news'],
        providerPriority: ['gemini', 'openai'],
      };
      const result = await iaVisibilityService.run(payload);
      setRuns((prev) => [result, ...prev]);
    } catch (err) {
      const message = err instanceof HttpClientError ? err.message : 'No se pudo ejecutar el análisis.';
      setError(message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusLabel = (status: VisibilityStatus) => {
    if (status === 'up') return t('ia_visibility.filters.up');
    if (status === 'down') return t('ia_visibility.filters.down');
    return t('ia_visibility.filters.stable');
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Eye size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('ia_visibility.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('ia_visibility.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t('ia_visibility.client_selector')}
            </label>
            <select
              value={currentClientId || ''}
              onChange={(e) => switchClient?.(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t('ia_visibility.filters.keyword')}
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('ia_visibility.filters.keyword_placeholder')}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t('ia_visibility.filters.status')}
            </label>
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | VisibilityStatus)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              >
                <option value="all">{t('ia_visibility.filters.all')}</option>
                <option value="up">{t('ia_visibility.filters.up')}</option>
                <option value="stable">{t('ia_visibility.filters.stable')}</option>
                <option value="down">{t('ia_visibility.filters.down')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleRun}
              disabled={!currentClientId || isRunning}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-4 py-2 text-sm font-semibold"
            >
              {isRunning ? 'Ejecutando...' : 'Ejecutar análisis'}
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {t('ia_visibility.current_client')}: <strong>{currentClient?.name || '-'}</strong>
        </p>
        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">{t('ia_visibility.results_title')}</h2>
        {isLoading ? (
          <div className="py-6 flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 size={16} className="animate-spin" /> Cargando datos...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 pr-4">{t('ia_visibility.table.keyword')}</th>
                  <th className="py-2 pr-4">{t('ia_visibility.table.url')}</th>
                  <th className="py-2 pr-4">{t('ia_visibility.table.position')}</th>
                  <th className="py-2 pr-4">{t('ia_visibility.table.change')}</th>
                  <th className="py-2 pr-4">{t('ia_visibility.table.status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-3 pr-4 text-slate-800 dark:text-slate-200">{row.keyword}</td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{row.url}</td>
                    <td className="py-3 pr-4 text-slate-800 dark:text-slate-200">#{row.position}</td>
                    <td className={`py-3 pr-4 font-semibold ${row.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.change > 0 ? `+${row.change}` : row.change}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{getStatusLabel(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 && <p className="text-sm text-slate-500 py-4">{t('ia_visibility.no_results')}</p>}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-slate-500" />
          <h2 className="font-bold text-slate-900 dark:text-white">{t('ia_visibility.history_title')}</h2>
        </div>
        <ul className="space-y-3">
          {runs.map((entry, idx) => (
            <li
              key={`${entry.clientId}-${entry.providerUsed || 'provider'}-${idx}`}
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900"
            >
              <p className="text-xs text-slate-500 mb-1">{entry.createdAt || 'Sin fecha'} · {entry.providerUsed || 'n/a'}</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                Mentiones: {entry.mentions} · SOV: {entry.shareOfVoice} · Sentimiento: {entry.sentiment}
              </p>
            </li>
          ))}
          {runs.length === 0 && <li className="text-sm text-slate-500">Sin ejecuciones todavía.</li>}
        </ul>
      </div>
    </div>
  );
};

export default IAVisibility;
