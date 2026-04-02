import React from 'react';
import type { MockInsight } from '../mocks/insightsMockData';
import InsightRow from './InsightRow';

interface InsightsTableProps {
  insights: MockInsight[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onOpenDetail: (insight: MockInsight) => void;
}

const InsightsTable: React.FC<InsightsTableProps> = ({
  insights,
  selectedIds,
  onToggleSelection,
  onOpenDetail,
}) => {
  return (
    <div className="overflow-hidden rounded-brand-lg border border-border bg-surface">
      <table className="w-full border-collapse">
        <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2" />
            <th className="px-3 py-2">Keyword</th>
            <th className="px-3 py-2">Proyecto</th>
            <th className="px-3 py-2">Severidad</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2">Asignado</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {insights.map((insight) => (
            <InsightRow
              key={insight.id}
              insight={insight}
              selected={selectedIds.includes(insight.id)}
              onSelect={onToggleSelection}
              onOpen={onOpenDetail}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InsightsTable;
