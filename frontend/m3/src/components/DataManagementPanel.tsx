import React, { useRef } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useSettings } from '../context/SettingsContext';
import { Client } from '../types';

const DataManagementPanel: React.FC = () => {
  const { clients, generalNotes, addClient, restoreProjectData, currentClientId } = useProject();
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: Date.now(),
      clients: clients,
      generalNotes: generalNotes,
      settings: settings,
      currentClientId: currentClientId,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediaFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.version && data.clients) {
          if (
            window.confirm(
              '¿Estás seguro de restaurar estos datos? Se recuperarán los proyectos, notas y configuraciones. ¡Atención! Los proyectos existentes que coincidan con el backup serán sobrescritos.',
            )
          ) {
            // Use restoreProjectData for smart restore/overwrite
            restoreProjectData(data.clients, data.generalNotes || [], data.currentClientId);

            // Restore settings if available
            if (data.settings) {
              updateSettings(data.settings);
            }

            alert('Datos restaurados correctamente.');
          }
        } else {
          alert('Formato de archivo inválido.');
        }
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mt-6 border border-slate-200 dark:border-slate-700">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        Gestión de Datos
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          <Download size={14} /> Backup
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          <Upload size={14} /> Restaurar
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
          accept=".json"
        />
      </div>
      <p className="text-[10px] text-slate-400 mt-2 leading-tight">
        Guarda una copia de seguridad de todos tus proyectos y notas.
      </p>
    </div>
  );
};

export default DataManagementPanel;
