import React, { useMemo, useState } from 'react';
import { Save, Key, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ui/ToastContext';
import { useSettings } from '../context/SettingsContext';
import DataManagementPanel from '../components/DataManagementPanel';
import { parseBrandTerms } from '../utils/brandTerms';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { success } = useToast();

  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey || '');
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [mistralKey, setMistralKey] = useState(settings.mistralApiKey || '');

  const [openaiModel, setOpenaiModel] = useState(settings.openaiModel || 'gpt-4o');
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel || 'gemini-1.5-pro');
  const [mistralModel, setMistralModel] = useState(settings.mistralModel || 'mistral-large-latest');

  const [gscClientId, setGscClientId] = useState(settings.gscClientId || '');
  const [brandTermsText, setBrandTermsText] = useState((settings.brandTerms || []).join('\n'));

  const parsedBrandTerms = useMemo(() => parseBrandTerms(brandTermsText), [brandTermsText]);

  const handleSave = () => {
    updateSettings({
      openaiApiKey: openaiKey,
      geminiApiKey: geminiKey,
      mistralApiKey: mistralKey,
      openaiModel,
      geminiModel,
      mistralModel,
      gscClientId: gscClientId,
      brandTerms: parsedBrandTerms,
    });
    success('Configuración guardada en el navegador.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-slate-900 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-500/10">
          <Key size={24} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ajustes del Sistema</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gestiona tus claves de API y configuración local.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
          <h2 className="font-bold text-lg dark:text-white">Claves de API y Modelos (IA)</h2>
        </div>

        <div className="space-y-8">
          {/* Gemini */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Google Gemini
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Modelo</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                >
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-pro">Gemini Pro (Legacy)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700"></div>

          {/* OpenAI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                OpenAI (ChatGPT)
              </label>
              <span className="text-xs text-slate-400">Opcional</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">API Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Modelo</label>
                <select
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700"></div>

          {/* Mistral */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Mistral AI
              </label>
              <span className="text-xs text-slate-400">Opcional</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">API Key</label>
                <input
                  type="password"
                  value={mistralKey}
                  onChange={(e) => setMistralKey(e.target.value)}
                  placeholder="..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Modelo</label>
                <select
                  value={mistralModel}
                  onChange={(e) => setMistralModel(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                >
                  <option value="mistral-large-latest">Mistral Large</option>
                  <option value="mistral-medium">Mistral Medium</option>
                  <option value="mistral-small">Mistral Small</option>
                  <option value="open-mixtral-8x22b">Mixtral 8x22B</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
          <h2 className="font-bold text-lg dark:text-white">Google Search Console</h2>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            OAuth 2.0 Client ID
          </label>
          <input
            type="text"
            value={gscClientId}
            onChange={(e) => setGscClientId(e.target.value)}
            placeholder="xxxx-xxxx.apps.googleusercontent.com"
            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <p className="text-xs text-slate-400">
            Necesario para conectar con GSC desde el navegador.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
          <h2 className="font-bold text-lg dark:text-white">Términos de marca</h2>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Keywords de marca a excluir como keyword principal
          </label>
          <textarea
            value={brandTermsText}
            onChange={(e) => setBrandTermsText(e.target.value)}
            placeholder={"mi marca\nmarca oficial\nnombre comercial"}
            className="w-full min-h-[140px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <p className="text-xs text-slate-400">
            Introduce un término por línea o separado por comas. Se usará para marcar URLs como
            de marca al importar o reasignar keywords en la checklist. Detectados: {parsedBrandTerms.length}.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all"
        >
          <Save size={18} />
          Guardar Configuración
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
        <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
          <AlertTriangle size={18} /> Almacenamiento Local
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          Estas claves se guardan únicamente en el almacenamiento local de tu navegador. No se
          envían a ningún servidor backend propio.
        </p>
      </div>

      <DataManagementPanel />
    </div>
  );
};

export default Settings;
