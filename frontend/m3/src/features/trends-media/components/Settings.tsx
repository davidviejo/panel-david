import React, { useState } from 'react';
import { Database, Key, Save, Search } from 'lucide-react';
import { getSettings, saveSettings } from '../services/storage';
import { AppSettings } from '../types';

interface SettingsProps {
  onSettingsChanged: (settings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onSettingsChanged }) => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveSettings(settings);
    onSettingsChanged(settings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 flex items-center text-xl font-bold text-slate-800"><Key className="mr-2 h-5 w-5 text-blue-600" />Credenciales API</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Google Gemini API Key <span className="font-normal text-slate-400">(Opcional)</span></label>
            <input type="password" className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dejar vacío para usar VITE_GEMINI_API_KEY" value={settings.geminiApiKey} onChange={(event) => setSettings({ ...settings, geminiApiKey: event.target.value })} />
            <p className="mt-1 text-xs text-slate-500">Si no se especifica, el sistema intentará usar la variable de entorno VITE_GEMINI_API_KEY.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">SerpApi Key (Scraping Real)</label>
            <input type="password" className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter SerpApi Key..." value={settings.serpApiKey} onChange={(event) => setSettings({ ...settings, serpApiKey: event.target.value })} />
            <p className="mt-1 text-xs text-slate-500">Necesaria para obtener resultados reales de Google News. Si falla por CORS, el módulo usa mocks para no romper la experiencia.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 flex items-center text-xl font-bold text-slate-800"><Search className="mr-2 h-5 w-5 text-emerald-600" />Configuración de Búsqueda (SERPs)</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Queries Automatizadas</label>
            <textarea className="h-48 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={settings.searchQueries.join('\n')} onChange={(event) => setSettings({ ...settings, searchQueries: event.target.value.split('\n').filter((query) => query.trim() !== '') })} placeholder="Una query por línea..." />
            <p className="mt-1 text-xs text-slate-500">El sistema ejecutará estas búsquedas cuando lances el pipeline desde el panel integrado.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-slate-700">Fuentes Objetivo (Prioridad)</h4>
            <p className="mb-2 text-sm text-slate-600">Estas fuentes se mantienen como referencia editorial dentro del prompt y la interfaz.</p>
            <div className="flex flex-wrap gap-2">
              {settings.targetSources.map((source) => (
                <span key={source} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">{source}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className={`flex items-center space-x-2 rounded-lg px-6 py-3 font-semibold text-white transition-all ${saved ? 'bg-green-600' : 'bg-slate-900 hover:bg-slate-800'}`}>
          {saved ? <Database className="h-5 w-5" /> : <Save className="h-5 w-5" />}
          <span>{saved ? 'Guardado Correctamente' : 'Guardar Configuración'}</span>
        </button>
      </div>
    </div>
  );
};
