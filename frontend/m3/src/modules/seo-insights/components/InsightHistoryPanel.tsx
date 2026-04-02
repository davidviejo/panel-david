import React from 'react';
import type { InsightHistoryEvent } from '../mocks/insightsMockData';

interface InsightHistoryPanelProps {
  events: InsightHistoryEvent[];
}

const InsightHistoryPanel: React.FC<InsightHistoryPanelProps> = ({ events }) => {
  return (
    <div className="rounded-brand-md border border-border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Historial</p>
      <ul className="mt-2 space-y-2 text-sm">
        {events.map((event) => (
          <li key={event.id} className="rounded-md bg-surface p-2">
            <p className="font-medium text-foreground">{event.action}</p>
            <p className="text-xs text-muted">
              {event.actor} · {new Date(event.happenedAt).toLocaleString()}
            </p>
            {event.notes ? <p className="text-xs text-muted">{event.notes}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InsightHistoryPanel;
