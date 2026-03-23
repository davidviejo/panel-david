import React, { useState } from 'react';
import { X, Settings, Database, DollarSign, Target, Shield, AlertTriangle } from 'lucide-react';
import { SeoChecklistSettings, Capabilities } from '../../types/seoChecklist';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: SeoChecklistSettings;
  onSave: (settings: SeoChecklistSettings) => void;
  capabilities: Capabilities | null;
}

export const SeoChecklistSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  capabilities,
}) => {
  const [formData, setFormData] = useState<SeoChecklistSettings>(settings);

  const effectiveFormData = isOpen ? settings : formData;

  if (!isOpen) return null;

  const handleChange = (section: keyof SeoChecklistSettings, key: string, value: any) => {
    setFormData((prev) => {
      const base = isOpen ? settings : prev;
      if (section === 'competitorsMode') {
        return { ...base, competitorsMode: value };
      }
      return {
        ...prev,
        [section]: {
          ...base[section as 'serp' | 'budgets'],
          [key]: value,
        },
      };
    });
  };

  const handleSave = () => {
    onSave(effectiveFormData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Configuración Análisis SEO
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ajusta los límites y proveedores de datos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* SERP Configuration */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-lg pb-2 border-b border-slate-100 dark:border-slate-800">
              <Database size={20} className="text-blue-500" />
              <h3>SERP API & Proveedores</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Habilitar SERP API
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={effectiveFormData.serp.enabled}
                      onChange={(e) => handleChange('serp', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Proveedor
                  </label>
                  <select
                    value={effectiveFormData.serp.provider}
                    onChange={(e) => handleChange('serp', 'provider', e.target.value)}
                    disabled={!effectiveFormData.serp.enabled}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option
                      value="serpapi"
                      disabled={capabilities && !capabilities.serpProviders['serpapi']}
                    >
                      SerpApi{' '}
                      {capabilities && !capabilities.serpProviders['serpapi']
                        ? '(No disponible)'
                        : ''}
                    </option>
                    <option
                      value="dataforseo"
                      disabled={
                        !!(
                          capabilities &&
                          !capabilities.serpProviders['dataforseo'] &&
                          !(
                            formData.serp.dataforseoLogin?.trim() &&
                            formData.serp.dataforseoPassword?.trim()
                          )
                        )
                      }
                    >
                      DataForSEO{' '}
                      {capabilities &&
                      !capabilities.serpProviders['dataforseo'] &&
                      !(
                        formData.serp.dataforseoLogin?.trim() &&
                        formData.serp.dataforseoPassword?.trim()
                      )
                        ? '(No disponible)'
                        : ''}
                    </option>
                    <option
                      value="internal"
                      disabled={capabilities && !capabilities.serpProviders['internal']}
                    >
                      Internal Proxy{' '}
                      {capabilities && !capabilities.serpProviders['internal']
                        ? '(No disponible)'
                        : ''}
                    </option>
                  </select>
                  {formData.serp.provider === 'dataforseo' &&
                    capabilities &&
                    !capabilities.serpProviders['dataforseo'] &&
                    !(
                      formData.serp.dataforseoLogin?.trim() &&
                      formData.serp.dataforseoPassword?.trim()
                    ) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        DataForSEO no está configurado globalmente. Puedes usarlo desde aquí
                        introduciendo tus credenciales.
                      </p>
                    )}
                </div>

                {formData.serp.provider === 'dataforseo' && (
                  <div className="space-y-4 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20">
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <AlertTriangle size={14} className="mt-0.5 text-blue-500 shrink-0" />
                      <span>
                        Estas credenciales se guardan en el navegador del proyecto actual y se
                        envían al motor sólo cuando lanzas análisis avanzados desde esta pantalla.
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        DataForSEO Login
                      </label>
                      <input
                        type="text"
                        value={formData.serp.dataforseoLogin || ''}
                        onChange={(e) =>
                          handleChange('serp', 'dataforseoLogin', e.target.value.trim())
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="email / login"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        DataForSEO Password
                      </label>
                      <input
                        type="password"
                        value={formData.serp.dataforseoPassword || ''}
                        onChange={(e) =>
                          handleChange('serp', 'dataforseoPassword', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="password"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Max Keywords por URL
                  </label>
                  <input
                    type="number"
                    value={effectiveFormData.serp.maxKeywordsPerUrl}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const limit = capabilities?.limits.maxKeywordsPerUrl || Infinity;
                      if (val > limit) {
                        alert(`El valor máximo permitido es ${limit}`);
                      }
                      handleChange('serp', 'maxKeywordsPerUrl', Math.min(val, limit));
                    }}
                    disabled={!effectiveFormData.serp.enabled}
                    max={capabilities?.limits.maxKeywordsPerUrl}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  {capabilities?.limits.maxKeywordsPerUrl && (
                    <span className="text-xs text-slate-400 block mt-1">
                      Límite sistema: {capabilities.limits.maxKeywordsPerUrl}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Max Competidores por KW
                  </label>
                  <input
                    type="number"
                    value={effectiveFormData.serp.maxCompetitorsPerKeyword}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const limit = capabilities?.limits.maxCompetitorsPerKeyword || Infinity;
                      if (val > limit) {
                        alert(`El valor máximo permitido es ${limit}`);
                      }
                      handleChange('serp', 'maxCompetitorsPerKeyword', Math.min(val, limit));
                    }}
                    disabled={!effectiveFormData.serp.enabled}
                    max={capabilities?.limits.maxCompetitorsPerKeyword}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  {capabilities?.limits.maxCompetitorsPerKeyword && (
                    <span className="text-xs text-slate-400 block mt-1">
                      Límite sistema: {capabilities.limits.maxCompetitorsPerKeyword}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Budgets & Limits */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-lg pb-2 border-b border-slate-100 dark:border-slate-800">
              <Shield size={20} className="text-emerald-500" />
              <h3>Límites y Presupuesto</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Max URLs por Lote
                </label>
                <input
                  type="number"
                  value={effectiveFormData.budgets.maxUrlsPerBatch}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const limit = capabilities?.limits.maxUrlsPerBatch || Infinity;
                    if (val > limit) {
                      alert(`El valor máximo permitido es ${limit}`);
                    }
                    handleChange('budgets', 'maxUrlsPerBatch', Math.min(val, limit));
                  }}
                  max={capabilities?.limits.maxUrlsPerBatch}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                {capabilities?.limits.maxUrlsPerBatch && (
                  <span className="text-xs text-slate-400 block mt-1">
                    Límite sistema: {capabilities.limits.maxUrlsPerBatch}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Presupuesto Diario (€)
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    value={effectiveFormData.budgets.dailyBudget}
                    onChange={(e) =>
                      handleChange('budgets', 'dailyBudget', parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Coste Max Estimado / Lote
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    value={effectiveFormData.budgets.maxEstimatedCostPerBatch}
                    onChange={(e) =>
                      handleChange(
                        'budgets',
                        'maxEstimatedCostPerBatch',
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Competitors Mode */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-lg pb-2 border-b border-slate-100 dark:border-slate-800">
              <Target size={20} className="text-purple-500" />
              <h3>Modo Competidores</h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <label
                className={`flex-1 flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.competitorsMode === 'autoFromSerp'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name="competitorsMode"
                  value="autoFromSerp"
                  checked={effectiveFormData.competitorsMode === 'autoFromSerp'}
                  onChange={() => handleChange('competitorsMode', '', 'autoFromSerp')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="block font-medium text-slate-900 dark:text-white">
                    Automático (desde SERP)
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Extrae competidores de los resultados de búsqueda. Requiere SERP API.
                  </span>
                </div>
              </label>

              <label
                className={`flex-1 flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.competitorsMode === 'off'
                    ? 'border-slate-500 bg-slate-50 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="competitorsMode"
                  value="off"
                  checked={formData.competitorsMode === 'off'}
                  onChange={() => handleChange('competitorsMode', '', 'off')}
                  className="mt-1 text-slate-600 focus:ring-slate-500"
                />
                <div>
                  <span className="block font-medium text-slate-900 dark:text-white">
                    Desactivado
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    No analizar competidores. Ahorra costes pero reduce profundidad de análisis.
                  </span>
                </div>
              </label>
            </div>

            {!formData.serp.enabled && formData.competitorsMode === 'autoFromSerp' && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl text-sm">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>
                  El modo automático requiere habilitar la SERP API. Se usará la configuración por
                  defecto si se ejecuta en modo Avanzado.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
