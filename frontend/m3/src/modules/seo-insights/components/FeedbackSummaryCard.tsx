import React from 'react';
import type { InsightFeedbackSummary } from '../mocks/insightsMockData';

interface FeedbackSummaryCardProps {
  feedback: InsightFeedbackSummary;
}

const FeedbackSummaryCard: React.FC<FeedbackSummaryCardProps> = ({ feedback }) => {
  return (
    <article className="rounded-brand-md border border-border bg-background p-3">
      <p className="text-xs uppercase tracking-wide text-muted">Feedback histórico</p>
      <p className="mt-1 text-sm text-foreground">Rating medio: {feedback.avgRating.toFixed(1)} / 5</p>
      <p className="text-sm text-muted">Usado {feedback.usedCount} · Ignorado {feedback.ignoredCount}</p>
      <p className="text-sm text-muted">
        Efectividad {(feedback.effectivenessRate * 100).toFixed(0)}%
      </p>
    </article>
  );
};

export default FeedbackSummaryCard;
