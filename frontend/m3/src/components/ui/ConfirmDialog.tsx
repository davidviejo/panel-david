import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const confirmClass =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700'
      : variant === 'warning'
        ? 'bg-amber-600 hover:bg-amber-700'
        : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-300">
            <AlertTriangle size={20} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
        </div>

        <div className="px-5 pb-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
