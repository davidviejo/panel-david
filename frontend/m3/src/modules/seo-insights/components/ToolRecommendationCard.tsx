import React from 'react';
import type { ToolRecommendation } from '../mocks/insightsMockData';

interface ToolRecommendationCardProps {
  recommendation: ToolRecommendation;
}

const ToolRecommendationCard: React.FC<ToolRecommendationCardProps> = ({ recommendation }) => {
  return (
    <article className="rounded-brand-md border border-border bg-background p-3">
      <p className="text-xs uppercase tracking-wide text-muted">Tool recomendado</p>
      <h4 className="mt-1 font-semibold text-foreground">{recommendation.title}</h4>
      <p className="mt-1 text-sm text-muted">{recommendation.description}</p>
      <p className="mt-2 text-xs text-muted">
        {recommendation.toolName} · Confianza {(recommendation.confidence * 100).toFixed(0)}%
      </p>
    </article>
  );
};

export default ToolRecommendationCard;
