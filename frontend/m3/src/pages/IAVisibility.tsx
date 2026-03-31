import React, { useMemo, useState } from 'react';
import { Eye, Filter, History, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../context/ProjectContext';

type VisibilityStatus = 'up' | 'stable' | 'down';

interface VisibilityRow {
  id: string;
  keyword: string;
  url: string;
  position: number;
  change: number;
  status: VisibilityStatus;
  updatedAt: string;
}

interface VisibilityHistoryEntry {
  id: string;
  date: string;
  summary: string;
}

const seedRows: VisibilityRow[] = [
  {
    id: '1',
    keyword: 'seo para medios digitales',
    url: '/guias/seo-medios',
    position: 5,
    change: 3,
    status: 'up',
    updatedAt: '2026-03-30',
  },
  {
    id: '2',
    keyword: 'indexacion google news',
    url: '/noticias/google-news-indexacion',
    position: 12,
    change: 0,
    status: 'stable',
    updatedAt: '2026-03-30',
  },
  {
    id: '3',
    keyword: 'clusterizacion semantica',
    url: '/seo/clusterizacion-semantica',
    position: 18,
    change: -4,
    status: 'down',
    updatedAt: '2026-03-29',
  },
];

const seedHistory: VisibilityHistoryEntry[] = [
  {
    id: 'h1',
    date: '2026-03-30',
    summary: 'Se detecta mejora en keywords informativas del clúster editorial.',
  },
  {
    id: 'h2',
    date: '2026-03-28',
    summary: 'Ligera caída en URLs de actualidad por canibalización interna.',
  },
  {
    id: 'h3',
    date: '2026-03-25',
    summary: 'Recuperación de posiciones tras actualizar enlazado interno.',
  },
];

const IAVisibility: React.FC = () => {
  const { t } = useTranslation();
  const { clients = [], currentClientId, switchClient, currentClient } = useProject();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VisibilityStatus>('all');

  const filteredRows = useMemo(() => {
    return seedRows.filter((row) => {
      const matchesQuery =
        !query ||
        row.keyword.toLowerCase().includes(query.toLowerCase()) ||
        row.url.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('ia_visibility.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{t('ia_visibility.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {t('ia_visibility.current_client')}: <strong>{currentClient?.name || '-'}</strong>
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">{t('ia_visibility.results_title')}</h2>
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
          {filteredRows.length === 0 && (
            <p className="text-sm text-slate-500 py-4">{t('ia_visibility.no_results')}</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <History size={18} className="text-slate-500" />
          <h2 className="font-bold text-slate-900 dark:text-white">{t('ia_visibility.history_title')}</h2>
        </div>
        <ul className="space-y-3">
          {seedHistory.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900"
            >
              <p className="text-xs text-slate-500 mb-1">{entry.date}</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{entry.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IAVisibility;
