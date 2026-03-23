import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Rss,
  Search,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_SETTINGS, DEFAULT_SYSTEM_PROMPT, MOCK_TRENDS } from '../features/trends-media/constants';
import { getTrendPipelineStatus, startTrendPipeline } from '../features/trends-media/services/backendPipeline';
import { getSettings, resetSettings, saveSettings } from '../features/trends-media/services/storage';
import { AppSettings, DashboardStats, PipelineJobStatus, SearchMode, TrendResult } from '../features/trends-media/types';

const viewOptions = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'brief', label: 'Generar Brief', icon: FileText },
  { id: 'raw', label: 'Feed en Bruto', icon: Layers },
  { id: 'trends', label: 'Tendencias', icon: Activity },
  { id: 'settings', label: 'Configuración', icon: SettingsIcon },
] as const;

type ViewId = (typeof viewOptions)[number]['id'];

type PipelineState = 'idle' | 'fetching' | 'analyzing' | 'done' | 'error';

const parseLines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean);

const priorityMeta = (item: TrendResult) => {
  const score = Number(item.relevance_score || 0);
  if (score >= 60) return { label: 'P1', badge: 'bg-red-100 text-red-700', border: 'border-red-200' };
  if (score >= 25) return { label: 'P2', badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200' };
  if (score > 0) return { label: 'P3', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200' };
  return { label: 'DISCARD', badge: 'bg-slate-100 text-slate-500', border: 'border-slate-200' };
};

const modeLabel: Record<SearchMode, string> = {
  free: 'Modo Gratuito',
  pro: 'Modo Google Pro',
  demo: 'Modo Demo',
};

const sourceTypeLabel: Record<string, string> = {
  rss: 'RSS',
  html: 'Scraping HTML',
  serp: 'SERP',
  dataforseo: 'DataForSEO',
  demo: 'Demo',
  google_internal: 'Google Internal',
};

const TrendsMediaPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [results, setResults] = useState<TrendResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('Pipeline listo.');
  const [pipelineState, setPipelineState] = useState<PipelineState>('idle');
  const [progress, setProgress] = useState(0);
  const [lastRun, setLastRun] = useState('Pendiente');
  const [jobId, setJobId] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stats = useMemo<DashboardStats>(() => {
    const p1 = results.filter((item) => priorityMeta(item).label === 'P1').length;
    const discarded = results.filter((item) => ['P3', 'DISCARD'].includes(priorityMeta(item).label)).length;
    return {
      sourcesScanned: results.length,
      itemsFound: results.length,
      highPriority: p1,
      duplicatesRemoved: discarded,
    };
  }, [results]);

  const prioritizedItems = useMemo(
    () => results.filter((item) => ['P1', 'P2'].includes(priorityMeta(item).label)),
    [results],
  );
  const discardedItems = useMemo(
    () => results.filter((item) => !['P1', 'P2'].includes(priorityMeta(item).label)),
    [results],
  );

  useEffect(() => () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
  }, []);

  const persistSettings = (nextSettings: AppSettings) => {
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const loadDemo = () => {
    const nextSettings = { ...settings, searchMode: 'demo' as const };
    persistSettings(nextSettings);
    setStatusMessage('Configuración demo cargada. Puedes lanzar el pipeline sin credenciales.');
  };

  const handleResetPrompt = () => {
    persistSettings({ ...settings, systemPrompt: DEFAULT_SYSTEM_PROMPT });
  };

  const handleResetAll = () => {
    const defaults = resetSettings();
    setSettings(defaults);
    setStatusMessage('Configuración restablecida a los valores por defecto.');
  };

  const syncFromJob = (data: PipelineJobStatus) => {
    setProgress(data.progress || 0);
    setLogs(data.log || []);
    setStatusMessage((data.log || []).slice(-1)[0] || 'Procesando...');

    if ((data.progress || 0) >= 50 && data.active) {
      setPipelineState('analyzing');
    }

    if (!data.active) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (data.error) {
        setPipelineState('error');
        setStatusMessage(data.error);
        return;
      }
      setResults(data.data || []);
      setPipelineState('done');
      setLastRun(new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()));
      setCurrentView('dashboard');
    }
  };

  const startPolling = (createdJobId: string) => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(async () => {
      try {
        const data = await getTrendPipelineStatus(createdJobId);
        syncFromJob(data);
      } catch (error) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setPipelineState('error');
        setStatusMessage(error instanceof Error ? error.message : 'Error consultando el estado del pipeline.');
      }
    }, 1200);
  };

  const runPipeline = async () => {
    try {
      persistSettings(settings);
      setPipelineState('fetching');
      setProgress(8);
      setLogs(['🚀 Iniciando pipeline integrado...']);
      setStatusMessage('Arrancando el pipeline con backend + scraping/API...');
      setCurrentView('brief');
      const createdJobId = await startTrendPipeline(settings);
      setJobId(createdJobId);
      startPolling(createdJobId);
    } catch (error) {
      setPipelineState('error');
      setStatusMessage(error instanceof Error ? error.message : 'No se pudo iniciar el pipeline.');
    }
  };

  const headerTitle =
    currentView === 'brief'
      ? 'Generar Brief'
      : currentView === 'raw'
        ? 'Feed en Bruto'
        : currentView === 'trends'
          ? 'Tendencias'
          : currentView === 'settings'
            ? 'Configuración'
            : 'Panel De Control';

  const modeDescription =
    settings.searchMode === 'free'
      ? 'Solo busca en los Feeds RSS configurados y en las URLs scrapeadas.'
      : settings.searchMode === 'pro'
        ? 'Usa SerpApi o DataForSEO para buscar en Google + RSS + Scraping Directo.'
        : 'Datos simulados (Mocks) para pruebas. Ideal para ver cómo funciona la IA sin configurar nada.';

  return (
    <div className="flex min-h-full w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-xl">
      <aside className="flex w-72 flex-col bg-slate-950 text-slate-300">
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center gap-3 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold">E</span>
            <div>
              <div className="font-bold">Eco3 Automator</div>
              <div className="text-xs text-slate-400">Editorial Automation v1.0</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {viewOptions.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setCurrentView(view.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${currentView === view.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{view.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl bg-slate-900 p-4 text-xs">
            <div className="mb-2 font-semibold text-white">Estado del Sistema</div>
            <div className="mb-2 flex items-center gap-2 text-emerald-400">
              <span className={`h-2 w-2 rounded-full ${pipelineState === 'error' ? 'bg-red-500' : pipelineState === 'idle' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
              <span>{pipelineState === 'idle' ? 'Listo' : pipelineState === 'error' ? 'Error' : 'En proceso'}</span>
            </div>
            <div className="text-slate-500">Última ejecución</div>
            <div className="mt-1 font-semibold text-white">{lastRun}</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{headerTitle}</h1>
            <p className="text-sm text-slate-500">{settings.regionLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={loadDemo} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <RefreshCw className="mr-2 inline h-4 w-4" />Cargar Demo
            </button>
            <button type="button" onClick={() => setCurrentView('settings')} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
              <SettingsIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{settings.profileName}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">ID: {settings.profileId}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{modeLabel[settings.searchMode]}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={runPipeline}
                disabled={pipelineState === 'fetching' || pipelineState === 'analyzing'}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {pipelineState === 'fetching' || pipelineState === 'analyzing' ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <Play className="mr-2 inline h-4 w-4" />}
                {results.length ? 'Actualizar pipeline' : 'Ejecutar análisis'}
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-2 text-sm font-semibold text-slate-900">Motor de Búsqueda (Estrategia)</div>
                <div className="mb-1 text-sm font-semibold text-blue-700">{modeLabel[settings.searchMode]}</div>
                <p className="text-sm text-slate-600">{modeDescription}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">Pipeline</div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{pipelineState.toUpperCase()}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-600">{statusMessage}</p>
                {jobId && <p className="mt-2 text-xs text-slate-400">Job ID: {jobId}</p>}
              </div>
            </div>
          </section>

          {currentView === 'dashboard' && (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Fuentes Escaneadas', value: stats.sourcesScanned, icon: <Database className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
                  { label: 'Items Detectados', value: stats.itemsFound, icon: <Search className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50' },
                  { label: 'Alta Prioridad (P1)', value: stats.highPriority, icon: <Sparkles className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50' },
                  { label: 'Filtrados/Duplicados', value: stats.duplicatesRemoved, icon: <Layers className="h-5 w-5 text-slate-600" />, bg: 'bg-slate-100' },
                ].map((card) => (
                  <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-xl p-3 ${card.bg}`}>{card.icon}</div>
                      <div>
                        <div className="text-sm text-slate-500">{card.label}</div>
                        <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Tendencias de búsqueda</div>
                      <h3 className="text-lg font-semibold text-slate-900">Google Trends</h3>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">En vivo</span>
                  </div>
                  <div className="space-y-5">
                    {MOCK_TRENDS.map((trend) => (
                      <div key={trend.keyword}>
                        <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                          <span>{trend.keyword}</span>
                          <span>{trend.growth}</span>
                        </div>
                        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(100, Math.round(trend.volume / 100))}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">Log de ejecución</h3>
                  <div className="max-h-80 space-y-3 overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-cyan-300">
                    {logs.length ? logs.map((line, index) => <div key={`${line}-${index}`}>{line}</div>) : <div>Sin actividad todavía.</div>}
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h3 className="text-lg font-semibold text-slate-900">Últimas Noticias Detectadas</h3>
                  <span className="text-xs font-medium text-slate-500">{results.length} clusters</span>
                </div>
                {results.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No hay datos analizados todavía.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-3">Prio</th>
                          <th className="px-6 py-3">Score</th>
                          <th className="px-6 py-3">Tema</th>
                          <th className="px-6 py-3">Contexto</th>
                          <th className="px-6 py-3">Fuente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.slice(0, 8).map((item) => {
                          const meta = priorityMeta(item);
                          return (
                            <tr key={`${item.topic}-${item.rank}`}>
                              <td className="px-6 py-3"><span className={`rounded px-2 py-1 text-xs font-bold ${meta.badge}`}>{meta.label}</span></td>
                              <td className="px-6 py-3 font-mono font-bold text-blue-600">{item.relevance_score || 0}</td>
                              <td className="px-6 py-3 font-medium text-slate-900">{item.topic}</td>
                              <td className="px-6 py-3 text-slate-500">{item.fit_label || item.context}</td>
                              <td className="px-6 py-3 text-slate-400">{item.traffic}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {currentView === 'brief' && (
            <section className="grid gap-6 lg:grid-cols-[1.5fr,0.8fr]">
              <div className="space-y-4">
                {pipelineState === 'fetching' || pipelineState === 'analyzing' ? (
                  <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900">Analizando con API y scraping...</h3>
                    <p className="mt-2 text-sm text-slate-500">{statusMessage}</p>
                  </div>
                ) : prioritizedItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
                    No hay temas prioritarios todavía. Ejecuta el pipeline o carga la demo.
                  </div>
                ) : (
                  prioritizedItems.map((item, index) => {
                    const meta = priorityMeta(item);
                    return (
                      <article key={`${item.topic}-${index}`} className={`rounded-2xl border bg-white p-6 shadow-sm ${meta.border}`}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded px-2 py-1 text-xs font-bold ${meta.badge}`}>{meta.label}</span>
                            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{item.fit_label || 'Editorial'}</span>
                          </div>
                          <span className="text-xs text-slate-400">Score {item.relevance_score || 0}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{item.topic}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.context}</p>
                        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Interés editorial</div>
                          {item.opportunity_note || 'Sin oportunidad adicional calculada.'}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                          <div className="flex flex-wrap gap-3">
                            <span><strong>Match:</strong> {item.matched_terms?.join(', ') || 'Sin match directo'}</span>
                            <span><strong>Fuente:</strong> {item.traffic}</span>
                          </div>
                          <a href={item.google_link} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:text-blue-800">
                            Leer original <ExternalLink className="ml-1 inline h-3 w-3" />
                          </a>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-lg font-semibold text-slate-900">Resumen</h3>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div><strong>Clusters totales:</strong> {results.length}</div>
                    <div><strong>Temas prioritarios:</strong> {prioritizedItems.length}</div>
                    <div><strong>Fuentes objetivo:</strong> {settings.targetSources.join(', ') || 'Sin configurar'}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-lg font-semibold text-slate-900">Descartados / Baja prioridad</h3>
                  <div className="space-y-3">
                    {discardedItems.length ? (
                      discardedItems.map((item, index) => {
                        const meta = priorityMeta(item);
                        return (
                          <div key={`${item.topic}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="mb-1 flex items-start justify-between gap-3">
                              <div className="text-sm font-medium text-slate-900">{item.topic}</div>
                              <span className={`rounded px-2 py-1 text-[10px] font-bold ${meta.badge}`}>{meta.label}</span>
                            </div>
                            <div className="text-xs text-slate-500">{item.context}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-slate-400">No hay items descartados.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {currentView === 'raw' && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-900">Feed en Bruto</h3>
                <p className="text-sm text-slate-500">Resultados sin resumir para validar scraping, RSS y proveedor SERP/DataForSEO.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Tema</th>
                      <th className="px-6 py-3">Tipo</th>
                      <th className="px-6 py-3">Contexto</th>
                      <th className="px-6 py-3">Origen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.length ? (
                      results.map((item, index) => (
                        <tr key={`${item.topic}-${index}`}>
                          <td className="px-6 py-3 text-slate-400">{index + 1}</td>
                          <td className="px-6 py-3 font-medium text-slate-900">{item.topic}</td>
                          <td className="px-6 py-3 text-slate-500">{sourceTypeLabel[item.source_type || 'demo'] || item.source_type || 'N/A'}</td>
                          <td className="px-6 py-3 text-slate-500">{item.context}</td>
                          <td className="px-6 py-3">
                            {item.source_url ? (
                              <a href={item.source_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">Abrir</a>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400">No hay datos en bruto todavía.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {currentView === 'trends' && (
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Fuentes Google (Site Search)</h3>
                <div className="flex flex-wrap gap-2">
                  {settings.googleDomains.map((domain) => (
                    <span key={domain} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">{domain}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Dominios ignorados</h3>
                <div className="flex flex-wrap gap-2">
                  {settings.ignoredDomains.map((domain) => (
                    <span key={domain} className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-red-600">{domain}</span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {currentView === 'settings' && (
            <section className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><Globe className="h-5 w-5 text-blue-600" />Credenciales y Proveedor SERP</div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Google Gemini API Key (Opcional)</label>
                      <input type="password" value={settings.geminiApiKey} onChange={(event) => setSettings({ ...settings, geminiApiKey: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Dejar vacío para usar variable de entorno (process.env.API_KEY)" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Proveedor de Búsqueda (SERP)</label>
                      <select value={settings.serpProvider} onChange={(event) => setSettings({ ...settings, serpProvider: event.target.value as AppSettings['serpProvider'] })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
                        <option value="serpapi">SerpApi</option>
                        <option value="dataforseo">DataForSEO</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">SerpApi Key</label>
                      <input type="password" value={settings.serpApiKey} onChange={(event) => setSettings({ ...settings, serpApiKey: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Enter SerpApi Key..." />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">DataForSEO Login</label>
                        <input value={settings.dataforseoLogin} onChange={(event) => setSettings({ ...settings, dataforseoLogin: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">DataForSEO Password</label>
                        <input type="password" value={settings.dataforseoPassword} onChange={(event) => setSettings({ ...settings, dataforseoPassword: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                      </div>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><Sparkles className="h-5 w-5 text-violet-600" />Personalización del Editor (Prompt IA)</div>
                  <div className="mb-3 flex justify-end">
                    <button type="button" onClick={handleResetPrompt} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Restablecer Prompt Original</button>
                  </div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Instrucciones de Sistema (Rol)</label>
                  <textarea value={settings.systemPrompt} onChange={(event) => setSettings({ ...settings, systemPrompt: event.target.value })} rows={11} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6" />
                  <p className="mt-2 text-xs text-slate-500">Define aquí el rol de la IA: “Experto SEO”, “Editor de Noticias”, “Analista Financiero”.</p>
                </article>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><Search className="h-5 w-5 text-emerald-600" />Configuración de Búsqueda</div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Ventana de Tiempo</label>
                      <select value={settings.timeWindow} onChange={(event) => setSettings({ ...settings, timeWindow: event.target.value as AppSettings['timeWindow'] })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
                        <option value="24h">Últimas 24 Horas (Estricto)</option>
                        <option value="48h">Últimas 48 Horas</option>
                        <option value="7d">Últimos 7 Días</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Motor de Búsqueda (Estrategia)</label>
                      <select value={settings.searchMode} onChange={(event) => setSettings({ ...settings, searchMode: event.target.value as SearchMode })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
                        <option value="free">Modo Gratuito</option>
                        <option value="pro">Modo Google Pro</option>
                        <option value="demo">Modo Demo</option>
                      </select>
                      <p className="mt-2 text-xs text-slate-500">{modeDescription}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Geo</label>
                        <input value={settings.geo} maxLength={2} onChange={(event) => setSettings({ ...settings, geo: event.target.value.toUpperCase() })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Modo de ranking</label>
                        <select value={settings.rankingMode} onChange={(event) => setSettings({ ...settings, rankingMode: event.target.value as AppSettings['rankingMode'] })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
                          <option value="balanced">Balanceado</option>
                          <option value="strict">Estricto</option>
                          <option value="discovery">Exploración</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900"><Rss className="h-5 w-5 text-orange-600" />Gestión de Fuentes y Dominios</div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Fuentes Google (Site Search)</label>
                      <textarea value={settings.googleDomains.join('\n')} onChange={(event) => setSettings({ ...settings, googleDomains: parseLines(event.target.value) })} rows={4} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Scraping Web Directo (RSS)</label>
                      <textarea value={settings.rssFeeds.join('\n')} onChange={(event) => setSettings({ ...settings, rssFeeds: parseLines(event.target.value) })} rows={5} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Rastreo URL HTML (Sin RSS)</label>
                      <textarea value={settings.htmlUrls.join('\n')} onChange={(event) => setSettings({ ...settings, htmlUrls: parseLines(event.target.value) })} rows={4} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Dominios Ignorados (Blacklist)</label>
                      <textarea value={settings.ignoredDomains.join('\n')} onChange={(event) => setSettings({ ...settings, ignoredDomains: parseLines(event.target.value) })} rows={5} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                    </div>
                  </div>
                </article>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-6 xl:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Queries de búsqueda</label>
                    <textarea value={settings.searchQueries.join('\n')} onChange={(event) => setSettings({ ...settings, searchQueries: parseLines(event.target.value) })} rows={5} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Focus terms</label>
                    <textarea value={settings.focusTerms.join('\n')} onChange={(event) => setSettings({ ...settings, focusTerms: parseLines(event.target.value) })} rows={5} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Fuentes objetivo</label>
                    <textarea value={settings.targetSources.join('\n')} onChange={(event) => setSettings({ ...settings, targetSources: parseLines(event.target.value) })} rows={5} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => persistSettings(settings)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Guardar Configuración</button>
                  <button type="button" onClick={handleResetAll} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Restablecer defaults</button>
                  <button type="button" onClick={loadDemo} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">Cargar Demo</button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrendsMediaPage;
