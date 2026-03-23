import React, { useMemo, useState } from 'react';
import { X, Clipboard, Upload } from 'lucide-react';
import { SeoPage, CHECKLIST_POINTS, ChecklistItem, ChecklistKey } from '../../types/seoChecklist';
import { normalizeSeoUrl } from '../../utils/seoUrlNormalizer';
import { useSettings } from '../../context/SettingsContext';
import { isBrandTermMatch } from '../../utils/brandTerms';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (pages: SeoPage[]) => void;
  existingPages: SeoPage[];
}

export const ImportUrlsModal: React.FC<Props> = ({ isOpen, onClose, onImport, existingPages }) => {
  const [inputText, setInputText] = useState('');
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(true);
  const { settings } = useSettings();
  const brandTerms = useMemo(() => settings.brandTerms || [], [settings.brandTerms]);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!inputText.trim()) return;

    const lines = inputText.trim().split('\n');
    let newPages: SeoPage[] = [];

    // Simple parsing: URL [tab] KW [tab] Type [tab] Geo [tab] Cluster
    lines.forEach((line) => {
      // Split by tab or comma
      const parts = line
        .split(/\t|,|;/)
        .map((s) => s.trim())
        .filter((s) => s !== '');

      if (parts.length >= 2) {
        // Minimum URL and KW
        // Initial checklist state
        const checklist: Record<string, ChecklistItem> = {};
        CHECKLIST_POINTS.forEach((pt) => {
          checklist[pt.key] = {
            key: pt.key,
            label: pt.label,
            status_manual: 'NA',
            notes_manual: '',
          };
        });

        const kwPrincipal = parts[1];
        const isBrandKeyword = isBrandTermMatch(kwPrincipal, brandTerms);

        newPages.push({
          id: crypto.randomUUID(),
          url: normalizeSeoUrl(parts[0]),
          kwPrincipal: isBrandKeyword ? '' : kwPrincipal,
          isBrandKeyword,
          pageType: parts[2] || 'Article',
          geoTarget: parts[3] || '',
          cluster: parts[4] || '',
          checklist: checklist as Record<ChecklistKey, ChecklistItem>,
        });
      }
    });

    if (ignoreDuplicates) {
      const existingUrls = new Set(existingPages.map((p) => p.url.toLowerCase()));
      const initialCount = newPages.length;
      newPages = newPages.filter((p) => !existingUrls.has(p.url.toLowerCase()));
      const skippedCount = initialCount - newPages.length;

      if (skippedCount > 0) {
        // We could show a toast here, but alert is fine for now or just log it
        console.log(`Skipped ${skippedCount} duplicate URLs`);
      }
    }

    if (newPages.length > 0) {
      onImport(newPages);
      setInputText('');
      onClose();
    } else {
      if (inputText.trim().length > 0) {
        alert(
          'No se importaron URLs nuevas. Es posible que todas sean duplicadas o el formato sea incorrecto.',
        );
      } else {
        alert('No se detectaron URLs válidas. Asegúrate de usar el formato: URL [tab] Keyword');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Upload size={24} className="text-blue-600" />
            Importar URLs
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Copia y pega tus URLs desde Excel o Google Sheets. El formato esperado es:
            <br />
            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs mt-1 block w-fit">
              URL | Keyword Principal | Tipo Página | Geo (Opcional) | Cluster (Opcional)
            </code>
          </p>
          {brandTerms.length > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
              Términos de marca activos: {brandTerms.join(', ')}. Si la keyword coincide, la URL
              se importará como "KW de marca" y sin keyword principal asignada.
            </p>
          )}

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-64 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            placeholder={`https://example.com/page1\tkeyword1\tblog\nhttps://example.com/page2\tkeyword2\tproduct`}
          />

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="ignoreDuplicates"
              checked={ignoreDuplicates}
              onChange={(e) => setIgnoreDuplicates(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="ignoreDuplicates"
              className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none"
            >
              Ignorar URLs que ya están en la lista (evitar duplicados)
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!inputText.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Clipboard size={18} />
            Importar URLs
          </button>
        </div>
      </div>
    </div>
  );
};
