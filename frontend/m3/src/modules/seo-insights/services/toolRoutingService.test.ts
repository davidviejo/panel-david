import { describe, expect, it } from 'vitest';
import { mapInsightToTool } from './toolRoutingService';

describe('mapInsightToTool', () => {
  it('returns base recommendations sorted with primary flag', () => {
    const result = mapInsightToTool({
      insight: { analysisType: 'full' },
    });

    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).toMatchObject({ isPrimary: true, toolKey: 'site_audit_tool' });
    expect(result.slice(1).every((entry) => entry.isPrimary === false)).toBe(true);
  });

  it('applies sector append override and client replace override with precedence', () => {
    const result = mapInsightToTool({
      insight: { analysisType: 'manual' },
      sectorId: 'ecommerce',
      clientId: 'priority-client-demo',
    });

    expect(result[0].toolKey).toBe('custom_playbook_tool');
    expect(result.some((entry) => entry.toolKey === 'checklist_tool')).toBe(false);
  });

  it('reorders recommendations using historical feedback', () => {
    const result = mapInsightToTool({
      insight: { analysisType: 'full' },
      feedbackHistory: [
        { toolKey: 'wpo_tool', score: 1 },
        { toolKey: 'site_audit_tool', score: 0 },
      ],
    });

    expect(result[0].toolKey).toBe('wpo_tool');
    expect(result[0].isPrimary).toBe(true);
  });
});
