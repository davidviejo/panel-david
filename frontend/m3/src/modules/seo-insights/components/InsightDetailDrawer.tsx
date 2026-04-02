import React from 'react';
import type { MockInsight } from '../mocks/insightsMockData';
import InsightHistoryPanel from './InsightHistoryPanel';
import ToolRecommendationCard from './ToolRecommendationCard';
import FeedbackSummaryCard from './FeedbackSummaryCard';

interface InsightDetailDrawerProps {
  insight: MockInsight | null;
  onClose: () => void;
}

const InsightDetailDrawer: React.FC<InsightDetailDrawerProps> = ({ insight, onClose }) => {
  if (!insight) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-20 w-full max-w-lg overflow-y-auto border-l border-border bg-surface p-4 shadow-2xl">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Detalle del insight</h3>
          <p className="text-sm text-muted">{insight.keyword}</p>
        </div>
        <button onClick={onClose} className="text-sm text-muted hover:text-foreground">
          Cerrar
        </button>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-muted break-all">{insight.pageUrl}</p>
        <ToolRecommendationCard recommendation={insight.recommendation} />
        <FeedbackSummaryCard feedback={insight.feedback} />
        <InsightHistoryPanel events={insight.history} />
      </div>
    </aside>
  );
};

export default InsightDetailDrawer;
