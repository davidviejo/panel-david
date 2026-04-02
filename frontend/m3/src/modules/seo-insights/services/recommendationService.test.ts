import { describe, expect, it } from 'vitest';
import { applyRecommendationFeedback, computeRecommendationWeights } from './recommendationService';
import type { RecommendedAction } from '../types/contracts';

const BASE_RECOMMENDATION: RecommendedAction = {
  insightId: 'insight-1',
  title: 'Actualizar schema de producto',
  description: 'Implementar schema con disponibilidad y precio.',
  priority: 'medium',
  toolKey: 'schema_tool',
};

describe('recommendationService', () => {
  it('boosts weight when sector outcomes and insight-tool effectiveness are positive', () => {
    const result = applyRecommendationFeedback({
      recommendation: BASE_RECOMMENDATION,
      insight: { analysisType: 'manual' },
      sectorId: 'ecommerce',
      feedbackLogs: [
        {
          id: '1',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
          insightId: 'insight-1',
          recommendationId: 'insight-1Actualizar schema de producto',
          projectId: 'project-1',
          reviewerId: 'user-1',
          rating: 5,
          feedbackAt: '2026-03-01T00:00:00.000Z',
          toolKey: 'schema_tool',
          insightType: 'manual',
          wasUsed: true,
          wasEffective: true,
        },
        {
          id: '2',
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
          insightId: 'insight-2',
          recommendationId: 'insight-1Actualizar schema de producto',
          projectId: 'project-1',
          reviewerId: 'user-2',
          rating: 4,
          feedbackAt: '2026-03-02T00:00:00.000Z',
          toolKey: 'schema_tool',
          insightType: 'manual',
          wasUsed: true,
          wasEffective: true,
        },
      ],
      outcomeLogs: [
        {
          id: 'o1',
          createdAt: '2026-03-03T00:00:00.000Z',
          updatedAt: '2026-03-03T00:00:00.000Z',
          projectId: 'project-1',
          measuredAt: '2026-03-03T00:00:00.000Z',
          metric: 'ctr',
          outcomeStatus: 'improved',
          recommendationId: 'insight-1Actualizar schema de producto',
          toolKey: 'schema_tool',
          sectorId: 'ecommerce',
        },
        {
          id: 'o2',
          createdAt: '2026-03-03T00:00:00.000Z',
          updatedAt: '2026-03-03T00:00:00.000Z',
          projectId: 'project-1',
          measuredAt: '2026-03-03T00:00:00.000Z',
          metric: 'ctr',
          outcomeStatus: 'improved',
          recommendationId: 'insight-1Actualizar schema de producto',
          toolKey: 'schema_tool',
          sectorId: 'ecommerce',
        },
      ],
      actionLogs: [
        {
          id: 'a1',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
          insightId: 'insight-1',
          projectId: 'project-1',
          actorId: 'u1',
          actionType: 'applied',
          happenedAt: '2026-03-01T00:00:00.000Z',
          recommendationId: 'insight-1Actualizar schema de producto',
          toolKey: 'schema_tool',
          applied: true,
        },
      ],
    });

    expect(result.weight).toBeGreaterThan(1);
    expect(result.delta).toBeGreaterThan(0);
  });

  it('penalizes recommendation when patterns are ignored and effectiveness is low', () => {
    const result = applyRecommendationFeedback({
      recommendation: BASE_RECOMMENDATION,
      insight: { analysisType: 'manual' },
      feedbackLogs: [
        {
          id: 'f3',
          createdAt: '2026-03-03T00:00:00.000Z',
          updatedAt: '2026-03-03T00:00:00.000Z',
          insightId: 'insight-1',
          recommendationId: 'insight-1Actualizar schema de producto',
          projectId: 'project-1',
          reviewerId: 'user-1',
          rating: 1,
          feedbackAt: '2026-03-03T00:00:00.000Z',
          toolKey: 'schema_tool',
          insightType: 'manual',
          wasEffective: false,
          clientIgnoredPattern: true,
        },
        {
          id: 'f4',
          createdAt: '2026-03-04T00:00:00.000Z',
          updatedAt: '2026-03-04T00:00:00.000Z',
          insightId: 'insight-1',
          recommendationId: 'insight-1Actualizar schema de producto',
          projectId: 'project-1',
          reviewerId: 'user-1',
          rating: 2,
          feedbackAt: '2026-03-04T00:00:00.000Z',
          toolKey: 'schema_tool',
          insightType: 'manual',
          wasEffective: false,
          clientIgnoredPattern: true,
        },
      ],
      actionLogs: [
        {
          id: 'a2',
          createdAt: '2026-03-05T00:00:00.000Z',
          updatedAt: '2026-03-05T00:00:00.000Z',
          insightId: 'insight-1',
          projectId: 'project-1',
          actorId: 'u1',
          actionType: 'ignored',
          happenedAt: '2026-03-05T00:00:00.000Z',
          recommendationId: 'insight-1Actualizar schema de producto',
          patternIgnored: true,
          toolKey: 'schema_tool',
        },
      ],
    });

    expect(result.weight).toBeLessThan(0.7);
    expect(result.delta).toBeLessThan(0);
  });

  it('marks recommendations as tested when similar cases were resolved and ranks by weight', () => {
    const ranked = computeRecommendationWeights({
      insight: { analysisType: 'manual' },
      recommendations: [
        BASE_RECOMMENDATION,
        {
          ...BASE_RECOMMENDATION,
          title: 'Ajustar snippets',
          toolKey: 'snippet_tool',
          priority: 'high',
        },
      ],
      outcomeLogs: [
        {
          id: 'o3',
          createdAt: '2026-03-06T00:00:00.000Z',
          updatedAt: '2026-03-06T00:00:00.000Z',
          projectId: 'project-1',
          measuredAt: '2026-03-06T00:00:00.000Z',
          metric: 'ctr',
          recommendationId: 'insight-1Actualizar schema de producto',
          toolKey: 'schema_tool',
          similarCasesResolved: 3,
          outcomeStatus: 'improved',
        },
      ],
    });

    expect(ranked[0].isPrimary).toBe(true);
    expect(ranked[0].weight).toBeGreaterThanOrEqual(ranked[1].weight ?? 0);
    expect(ranked.some((entry) => entry.tested)).toBe(true);
  });
});
