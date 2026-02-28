import { describe, it, expect } from 'vitest';
import {
  analyzeStrikingDistance,
  analyzeLowCtr,
  analyzeQuickWins,
  analyzeCannibalization,
} from './gscInsights';
import { GSCRow } from '../types';

describe('GSC Insights', () => {
  const mockRows: GSCRow[] = [
    { keys: ['pos1'], clicks: 100, impressions: 1000, ctr: 0.1, position: 1 },
    { keys: ['quickWin1'], clicks: 20, impressions: 1000, ctr: 0.02, position: 5 },
    { keys: ['quickWin2'], clicks: 10, impressions: 1000, ctr: 0.01, position: 9 },
    { keys: ['page2'], clicks: 5, impressions: 1000, ctr: 0.005, position: 12 },
    { keys: ['deep'], clicks: 0, impressions: 100, ctr: 0, position: 25 },
    { keys: ['lowCtrGoodRank'], clicks: 1, impressions: 200, ctr: 0.005, position: 3 },
  ];

  it('analyzeQuickWins should return keywords in position 4-10', () => {
    const result = analyzeQuickWins(mockRows);
    expect(result.title).toContain('Fruta Madura');
    expect(result.items.map((i) => i.keys[0])).toContain('quickWin1');
    expect(result.items.map((i) => i.keys[0])).toContain('quickWin2');
    expect(result.items.map((i) => i.keys[0])).not.toContain('pos1');
    expect(result.items.map((i) => i.keys[0])).not.toContain('page2');
  });

  it('analyzeStrikingDistance should return keywords in position 11-20', () => {
    const result = analyzeStrikingDistance(mockRows);
    expect(result.items.map((i) => i.keys[0])).toContain('page2');
    expect(result.items.map((i) => i.keys[0])).not.toContain('quickWin1'); // Should be excluded now
    expect(result.items.map((i) => i.keys[0])).not.toContain('deep');
  });

  it('analyzeLowCtr should return keywords with low CTR in top 10', () => {
    const result = analyzeLowCtr(mockRows);
    expect(result.items.map((i) => i.keys[0])).toContain('lowCtrGoodRank');
    // quickWin2 is pos 9, ctr 0.01 (<2%), impressions 1000 (>100). Should be included?
    // analyzeLowCtr logic: >100 imp, <2% ctr, pos <= 10.
    expect(result.items.map((i) => i.keys[0])).toContain('quickWin2');
  });

  it('analyzeCannibalization should detect pages competing for the same keyword', () => {
    const cannibalizationRows: GSCRow[] = [
      { keys: ['cannibal', 'page1'], clicks: 50, impressions: 1000, ctr: 0.05, position: 3 },
      { keys: ['cannibal', 'page2'], clicks: 40, impressions: 900, ctr: 0.04, position: 4 }, // Close position, fighting
      { keys: ['safe', 'pageA'], clicks: 100, impressions: 2000, ctr: 0.05, position: 1 },
      { keys: ['safe', 'pageB'], clicks: 10, impressions: 100, ctr: 0.1, position: 20 }, // Far position
      { keys: ['lowImp', 'pageX'], clicks: 5, impressions: 1000, ctr: 0.005, position: 5 },
      { keys: ['lowImp', 'pageY'], clicks: 1, impressions: 40, ctr: 0.02, position: 6 }, // Low impressions (<50), should be ignored
    ];

    const result = analyzeCannibalization(cannibalizationRows);
    expect(result.items.length).toBe(1);
    expect(result.items[0].keys[0]).toBe('cannibal');
    // Logic: adds count to keys[1]
    expect(result.items[0].keys[1]).toContain('2 URLs');
  });
});
