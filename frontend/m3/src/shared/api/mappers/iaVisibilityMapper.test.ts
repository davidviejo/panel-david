import { describe, expect, it } from 'vitest';
import { mapIAVisibilityHistoryToViewModel } from './iaVisibilityMapper';
import { IAVisibilityRunResponseContract } from '../contracts/iaVisibility';

describe('mapIAVisibilityHistoryToViewModel', () => {
  it('maps backend contract fields to the UI view model', () => {
    const backendEntry: IAVisibilityRunResponseContract = {
      clientId: 'client-1',
      mentions: 12,
      shareOfVoice: 34,
      sentiment: 0.67,
      competitorAppearances: { competitorA: 2 },
      rawEvidence: [],
      runTrigger: 'scheduled',
      providerUsed: 'openai',
      version: 3,
    };

    const result = mapIAVisibilityHistoryToViewModel(backendEntry, 4);

    expect(result).toEqual({
      id: 'client-1-4',
      clientId: 'client-1',
      runTriggerLabel: 'scheduled',
      providerLabel: 'openai',
      versionLabel: 'v3',
      shareOfVoice: 34,
      mentions: 12,
      sentiment: 0.67,
    });
  });

  it('applies safe defaults when optional backend fields are missing', () => {
    const backendEntry: IAVisibilityRunResponseContract = {
      clientId: 'client-2',
      mentions: 0,
      shareOfVoice: 0,
      sentiment: 0,
      competitorAppearances: {},
      rawEvidence: [],
    };

    const result = mapIAVisibilityHistoryToViewModel(backendEntry, 0);

    expect(result.runTriggerLabel).toBe('manual');
    expect(result.providerLabel).toBe('n/a');
    expect(result.versionLabel).toBe('v1');
  });
});
