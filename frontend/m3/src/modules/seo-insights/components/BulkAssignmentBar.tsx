import React from 'react';

interface BulkAssignmentBarProps {
  selectedCount: number;
  onAssign: () => void;
  onClear: () => void;
}

const BulkAssignmentBar: React.FC<BulkAssignmentBarProps> = ({ selectedCount, onAssign, onClear }) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-brand-lg border border-border bg-surface p-3 shadow-card">
      <p className="text-sm text-foreground">{selectedCount} insights seleccionados</p>
      <div className="flex gap-2">
        <button onClick={onClear} className="rounded-brand-md border border-border px-3 py-2 text-sm">
          Limpiar
        </button>
        <button onClick={onAssign} className="rounded-brand-md bg-primary px-3 py-2 text-sm text-on-primary">
          Asignar en bloque
        </button>
      </div>
    </div>
  );
};

export default BulkAssignmentBar;
