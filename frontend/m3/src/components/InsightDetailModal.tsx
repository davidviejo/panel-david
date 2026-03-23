import React, { useState, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Download,
  Search,
  Sparkles,
  Bot,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SeoInsight } from '../types/seoInsights';
import { generateSEOAnalysis } from '../services/geminiService';
import { generateSEOAnalysisWithOpenAI } from '../services/openaiService';
import { useToast } from './ui/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { useProject } from '../context/ProjectContext';

interface InsightDetailModalProps {
  insight: SeoInsight;
  onClose: () => void;
}

const formatUrlLabel = (url?: string) => {
  if (!url) return '-';

  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({ insight, onClose }) => {
  const [filter, setFilter] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const { success: showSuccess, error: showError } = useToast();
  const { getApiKey } = useSettings();
  const { addTask, modules } = useProject();

  const filteredItems = useMemo(() => {
    const lowerFilter = filter.toLowerCase();
    return (
      insight?.relatedRows?.filter((item) =>
        item.keys?.some((k) => k?.toLowerCase().includes(lowerFilter)),
      ) || []
    );
  }, [insight?.relatedRows, filter]);

  const handleCreateTask = (item: any) => {
    let targetModule = modules.find((m) => m.isCustom || m.title.includes('Extras'));
    if (!targetModule && modules.length > 0) targetModule = modules[0];

    if (!targetModule) {
      showError('No hay módulos disponibles para crear tareas.');
      return;
    }

    const title = `Optimizar: ${item.keys[0]}`;
    const description = [
      `Insight: ${insight.title}`,
      `Resumen: ${insight.summary}`,
      `Motivo: ${insight.reason}`,
      `Acción sugerida: ${insight.action}`,
      `Query: ${item.keys[0]}`,
      `URL: ${item.keys[1] || 'N/A'}`,
      `Posición: ${item.position.toFixed(1)}`,
      `CTR: ${(item.ctr * 100).toFixed(1)}%`,
    ].join('\n');

    addTask(targetModule.id, title, description, 'High', 'Strategy');
    showSuccess(`Tarea creada en módulo "${targetModule.title}"`);
  };

  const handleExport = () => {
    const headers = ['Query', 'URL', 'Clicks', 'Impressions', 'CTR', 'Position'];
    const csvContent = [
      headers.join(','),
      ...filteredItems.map((item) =>
        [
          `"${item.keys[0]}"`,
          `"${item.keys[1] || ''}"`,
          item.clicks,
          item.impressions,
          item.ctr,
          item.position,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${insight.title.replace(/\s+/g, '_')}_MediaFlow.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAiAnalysis = async (provider: 'gemini' | 'openai' = 'gemini') => {
    if (!getApiKey(provider)) {
      showError(
        `Configura tu API Key de ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} en Ajustes.`,
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const topItems = filteredItems
        .slice(0, 10)
        .map(
          (i) =>
            `- Query: ${i.keys[0]}, URL: ${i.keys[1] || 'N/A'}, Pos: ${i.position.toFixed(1)}, CTR: ${(i.ctr * 100).toFixed(1)}%`,
        )
        .join('\n');
      const prompt = `Analiza este insight SEO: ${insight.title}.\n\nResumen: ${insight.summary}\nMotivo: ${insight.reason}\nAcción sugerida: ${insight.action}\nPrioridad: ${insight.priority}\nSeveridad: ${insight.severity}\n\nDatos Top 10:\n${topItems}\n\nDame 3 acciones estratégicas concretas para mejorar estos resultados. Sé breve y directo.`;

      const result =
        provider === 'openai'
          ? await generateSEOAnalysisWithOpenAI(prompt, 'audit')
          : await generateSEOAnalysis(prompt, 'audit');

      setAiAnalysis(result);
      showSuccess('Análisis generado.');
    } catch (e) {
      showError('Error generando análisis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex justify-between items-start p-5 border-b border-slate-100 dark:border-slate-800 gap-4 shrink-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-bold">
              {insight.affectedCount} resultados
            </span>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full font-bold uppercase">
              Prioridad {insight.priority}
            </span>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full font-bold uppercase">
              {insight.visualContext.categoryLabel}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{insight.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
            {insight.summary}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 shrink-0"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Score</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">{insight.score}</div>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Confianza</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">{insight.confidence}</div>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Oportunidad</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">{insight.opportunity}</div>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Estado</div>
              <div className="font-bold text-slate-800 dark:text-slate-100 capitalize">{insight.status}</div>
            </div>
          </div>

          <button
            onClick={() => setShowContext((prev) => !prev)}
            className="inline-flex items-center gap-2 self-start lg:self-auto px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {showContext ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showContext ? 'Ocultar contexto' : 'Ver diagnóstico y evidencia'}
          </button>
        </div>
      </div>

      {showContext && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">
              Diagnóstico
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{insight.reason}</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">
              Acción recomendada
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{insight.action}</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 md:col-span-2">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">
              Evidencia
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {insight.evidence.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-700 dark:text-slate-300"
                >
                  <strong>{item.label}</strong>
                  <div className="mt-1">{item.value}</div>
                  {item.context ? <div className="mt-1 text-slate-400 break-all">{item.context}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4 items-stretch md:items-center border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar resultados..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shrink-0"
        >
          <Download size={16} /> CSV
        </button>
      </div>

      {aiAnalysis && (
        <div className="mx-5 mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 animate-in fade-in slide-in-from-top-2 relative shrink-0">
          <button
            onClick={() => setAiAnalysis(null)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
          <h4 className="text-purple-800 dark:text-purple-300 font-bold text-sm mb-2 flex items-center gap-2">
            <Sparkles size={16} /> Análisis IA
          </h4>
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {aiAnalysis}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 p-4 overflow-auto">
        <table className="w-full text-sm text-left table-fixed">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/95 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg w-[24%]">Query</th>
              <th className="px-4 py-3 w-[36%]">URL</th>
              <th className="px-4 py-3 text-right w-[10%]">Clics</th>
              <th className="px-4 py-3 text-right w-[10%]">Impr.</th>
              <th className="px-4 py-3 text-right w-[8%]">CTR</th>
              <th className="px-4 py-3 text-right w-[6%]">Pos</th>
              <th className="px-4 py-3 text-center rounded-tr-lg w-[6%]">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors align-top">
                  <td
                    className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 break-words"
                    title={item.keys[0]}
                  >
                    {item.keys[0]}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400" title={item.keys[1]}>
                    {item.keys[1] ? (
                      <a
                        href={item.keys[1]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-500 inline-flex items-start gap-1 break-all leading-relaxed"
                      >
                        <span>{formatUrlLabel(item.keys[1])}</span>
                        <ExternalLink size={10} className="mt-1 shrink-0" />
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {item.clicks.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">
                    {item.impressions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">
                    {(item.ctr * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    {item.position.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleCreateTask(item)}
                      className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                      title="Convertir en Tarea"
                    >
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex flex-col md:flex-row gap-3 justify-between md:items-center shrink-0">
        <span>
          Mostrando {filteredItems.length} de {insight.affectedCount} items totales.
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAiAnalysis('gemini')}
            disabled={isAnalyzing}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            title="Analizar con Gemini (Google)"
          >
            {isAnalyzing ? <span className="animate-spin">⏳</span> : <Sparkles size={16} />}
            Gemini
          </button>
          <button
            onClick={() => handleAiAnalysis('openai')}
            disabled={isAnalyzing}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            title="Analizar con ChatGPT (OpenAI)"
          >
            {isAnalyzing ? <span className="animate-spin">⏳</span> : <Bot size={16} />}
            ChatGPT
          </button>
        </div>
      </div>
    </div>
  );
};
