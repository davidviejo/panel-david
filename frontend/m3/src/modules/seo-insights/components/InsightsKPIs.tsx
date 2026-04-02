import React from 'react';
import { Card } from '../../../components/ui/Card';

interface InsightsKPIsProps {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

const InsightsKPIs: React.FC<InsightsKPIsProps> = ({ total, open, inProgress, resolved }) => {
  const kpis = [
    { label: 'Total insights', value: total },
    { label: 'Abiertos', value: open },
    { label: 'En progreso', value: inProgress },
    { label: 'Resueltos', value: resolved },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">{kpi.label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{kpi.value}</p>
        </Card>
      ))}
    </section>
  );
};

export default InsightsKPIs;
