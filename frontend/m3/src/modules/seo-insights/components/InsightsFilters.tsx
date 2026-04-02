import React from 'react';

export interface InsightFilterValue {
  query: string;
  severity: 'all' | 'low' | 'medium' | 'high' | 'critical';
  status: 'all' | 'open' | 'in_progress' | 'resolved' | 'ignored';
}

interface InsightsFiltersProps {
  value: InsightFilterValue;
  onChange: (next: InsightFilterValue) => void;
}

const InsightsFilters: React.FC<InsightsFiltersProps> = ({ value, onChange }) => {
  return (
    <section className="grid gap-3 rounded-brand-lg border border-border bg-surface p-4 md:grid-cols-3">
      <input
        value={value.query}
        onChange={(event) => onChange({ ...value, query: event.target.value })}
        className="h-10 rounded-brand-md border border-border bg-background px-3 text-sm"
        placeholder="Buscar keyword o URL"
      />
      <select
        value={value.severity}
        onChange={(event) =>
          onChange({ ...value, severity: event.target.value as InsightFilterValue['severity'] })
        }
        className="h-10 rounded-brand-md border border-border bg-background px-3 text-sm"
      >
        <option value="all">Severidad: todas</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select
        value={value.status}
        onChange={(event) =>
          onChange({ ...value, status: event.target.value as InsightFilterValue['status'] })
        }
        className="h-10 rounded-brand-md border border-border bg-background px-3 text-sm"
      >
        <option value="all">Estado: todos</option>
        <option value="open">Open</option>
        <option value="in_progress">In progress</option>
        <option value="resolved">Resolved</option>
        <option value="ignored">Ignored</option>
      </select>
    </section>
  );
};

export default InsightsFilters;
