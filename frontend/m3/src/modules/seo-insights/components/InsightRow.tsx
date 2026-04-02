import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import type { MockInsight } from '../mocks/insightsMockData';

interface InsightRowProps {
  insight: MockInsight;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (insight: MockInsight) => void;
}

const severityVariant: Record<MockInsight['severity'], 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

const InsightRow: React.FC<InsightRowProps> = ({ insight, selected, onSelect, onOpen }) => {
  return (
    <tr className="border-b border-border text-sm">
      <td className="px-3 py-3">
        <input type="checkbox" checked={selected} onChange={() => onSelect(insight.id)} />
      </td>
      <td className="px-3 py-3 font-medium text-foreground">{insight.keyword}</td>
      <td className="px-3 py-3 text-muted">{insight.projectName}</td>
      <td className="px-3 py-3">
        <Badge variant={severityVariant[insight.severity]}>{insight.severity}</Badge>
      </td>
      <td className="px-3 py-3 text-muted">{insight.status}</td>
      <td className="px-3 py-3 text-muted">{insight.assigneeName || 'Sin asignar'}</td>
      <td className="px-3 py-3 text-right">
        <button onClick={() => onOpen(insight)} className="text-primary hover:underline">
          Ver detalle
        </button>
      </td>
    </tr>
  );
};

export default InsightRow;
