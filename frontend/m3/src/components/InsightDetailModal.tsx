import React, { useState, useMemo } from 'react';
import { X, ExternalLink, Download, Search, Sparkles, Bot, Plus } from 'lucide-react';
import { InsightResult } from '../utils/gscInsights';
import { generateSEOAnalysis } from '../services/geminiService';
import { generateSEOAnalysisWithOpenAI } from '../services/openaiService';
import { useToast } from './ui/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { useProject } from '../context/ProjectContext';

interface InsightDetailModalProps {
  insight: InsightResult;
  onClose: () => void;
}

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({ insight, onClose }) => {
  const [filter, setFilter] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { success: showSuccess, error: showError } = useToast();
  const { getApiKey } = useSettings();
  const { addTask, modules } = useProject();

  const filteredItems = useMemo(() => {
    const lowerFilter = filter.toLowerCase();
    return (
      insight?.items?.filter((item) =>
        item.keys?.some((k) => k?.toLowerCase().includes(lowerFilter)),
      ) || []
    );
  }, [insight?.items, filter]);

  const handleCreateTask = (item: any) => {
    // Find "Extras" module or default to first
    let targetModule = modules.find((m) => m.isCustom || m.title.includes('Extras'));
    if (!targetModule && modules.length > 0) targetModule = modules[0];

    if (!targetModule) {
      showError('No hay módulos disponibles para crear tareas.');
      return;
    }

    const title = `Optimizar: ${item.keys[0]}`;
    const description = `Estrategia basada en Insight: ${insight.title}.\nQuery: ${item.keys[0]}\nURL: ${item.keys[1] || 'N/A'}\nPosición: ${item.position.toFixed(1)}\nCTR: ${(item.ctr * 100).toFixed(1)}%`;

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
    // Check if Key is available
    if (!getApiKey(provider)) {
      showError(
        `Configura tu API Key de ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} en Ajustes.`,
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      // Create a summary of the data for the AI
      const topItems = filteredItems
        .slice(0, 10)
        .map(
          (i) =>
            `- Query: ${i.keys[0]}, Pos: ${i.position.toFixed(1)}, CTR: ${(i.ctr * 100).toFixed(1)}%`,
        )
        .join('\n');
      const prompt = `Analiza estos datos de Search Console para el insight "${insight.title}" (${insight.description}).

      Datos Top 10:
      ${topItems}

      Dame 3 acciones estratégicas concretas para mejorar estos resultados. Sé breve y directo.`;

      let result = '';
      if (provider === 'openai') {
        result = await generateSEOAnalysisWithOpenAI(prompt, 'audit');
      } else {
        result = await generateSEOAnalysis(prompt, 'audit');
      }

      setAiAnalysis(result);
      showSuccess('Análisis generado.');
    } catch (e) {
      showError('Error generando análisis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {insight.title}
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
              {insight.count} Resultados
            </span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{insight.description}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          <X size={20} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-4 items-center">
        <div className="relative flex-1">
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
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors"
        >
          <Download size={16} /> CSV
        </button>
      </div>

      {/* AI Analysis Section */}
      {aiAnalysis && (
        <div className="mx-6 mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 animate-in fade-in slide-in-from-top-2 relative">
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

      {/* Table */}
      <div className="overflow-auto flex-1 p-4">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Query</th>
              <th className="px-4 py-3">URL</th>
              <th className="px-4 py-3 text-right">Clics</th>
              <th className="px-4 py-3 text-right">Impr.</th>
              <th className="px-4 py-3 text-right">CTR</th>
              <th className="px-4 py-3 text-right">Pos</th>
              <th className="px-4 py-3 text-center rounded-tr-lg">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, i) => (
                <tr
                  key={i}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td
                    className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]"
                    title={item.keys[0]}
                  >
                    {item.keys[0]}
                  </td>
                  <td
                    className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-[200px]"
                    title={item.keys[1]}
                  >
                    {item.keys[1] ? (
                      <a
                        href={item.keys[1]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-500 flex items-center gap-1"
                      >
                        {item.keys[1].replace('https://', '').split('/').pop() || '/'}
                        <ExternalLink size={10} />
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

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex justify-between items-center">
        <span>
          Mostrando {filteredItems.length} de {insight.count} items totales.
        </span>

        <div className="flex gap-2">
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
