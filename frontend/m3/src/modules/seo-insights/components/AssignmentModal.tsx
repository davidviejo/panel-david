import React from 'react';

interface AssignmentModalProps {
  open: boolean;
  options: Array<{ id: string; name: string }>;
  onClose: () => void;
  onAssign: (assigneeId: string) => void;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ open, options, onClose, onAssign }) => {
  const [selectedAssignee, setSelectedAssignee] = React.useState(options[0]?.id || '');

  React.useEffect(() => {
    setSelectedAssignee(options[0]?.id || '');
  }, [options]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-brand-lg border border-border bg-surface p-5">
        <h3 className="text-lg font-semibold text-foreground">Asignar insights</h3>
        <p className="text-sm text-muted">Selecciona una persona para la asignación.</p>
        <select
          value={selectedAssignee}
          onChange={(event) => setSelectedAssignee(event.target.value)}
          className="mt-4 h-10 w-full rounded-brand-md border border-border bg-background px-3"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-brand-md border border-border px-3 py-2 text-sm">
            Cancelar
          </button>
          <button
            onClick={() => onAssign(selectedAssignee)}
            className="rounded-brand-md bg-primary px-3 py-2 text-sm text-on-primary"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentModal;
