import React from 'react';
import InsightsHeader from '../modules/seo-insights/components/InsightsHeader';
import { Card } from '../components/ui/Card';
import { mockKeywordAssignments } from '../modules/seo-insights/mocks/insightsMockData';

const priorityClasses: Record<string, string> = {
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-muted',
};

const KeywordAssignmentCenter: React.FC = () => {
  const pending = mockKeywordAssignments.filter((item) => !item.assigneeId).length;

  return (
    <div className="space-y-4">
      <InsightsHeader
        title="Keyword Assignment Center"
        subtitle="Centro base para asignación de keywords usando mocks del módulo seo-insights."
      />
      <Card className="p-4">
        <p className="text-sm text-muted">Pendientes por asignar</p>
        <p className="text-2xl font-semibold text-foreground">{pending}</p>
      </Card>
      <div className="overflow-hidden rounded-brand-lg border border-border bg-surface">
        <table className="w-full border-collapse">
          <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Keyword</th>
              <th className="px-3 py-2">Proyecto</th>
              <th className="px-3 py-2">Prioridad</th>
              <th className="px-3 py-2">Asignado</th>
              <th className="px-3 py-2">Última actualización</th>
            </tr>
          </thead>
          <tbody>
            {mockKeywordAssignments.map((item) => (
              <tr key={item.id} className="border-b border-border text-sm">
                <td className="px-3 py-3 font-medium text-foreground">{item.keyword}</td>
                <td className="px-3 py-3 text-muted">{item.projectName}</td>
                <td className={`px-3 py-3 font-medium ${priorityClasses[item.priority]}`}>
                  {item.priority}
                </td>
                <td className="px-3 py-3 text-muted">{item.assigneeName || 'Sin asignar'}</td>
                <td className="px-3 py-3 text-muted">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KeywordAssignmentCenter;
