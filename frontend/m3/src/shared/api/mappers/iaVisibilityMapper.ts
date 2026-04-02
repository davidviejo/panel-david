import { IAVisibilityRunResponseContract } from '../contracts/iaVisibility';

export interface IAVisibilityHistoryItemViewModel {
  id: string;
  clientId: string;
  runTriggerLabel: string;
  providerLabel: string;
  versionLabel: string;
  shareOfVoice: number;
  mentions: number;
  sentiment: number;
}

export const mapIAVisibilityHistoryToViewModel = (
  entry: IAVisibilityRunResponseContract,
  index: number,
): IAVisibilityHistoryItemViewModel => {
  return {
    id: `${entry.clientId}-${index}`,
    clientId: entry.clientId,
    runTriggerLabel: entry.runTrigger ?? 'manual',
    providerLabel: entry.providerUsed ?? 'n/a',
    versionLabel: `v${entry.version ?? 1}`,
    shareOfVoice: entry.shareOfVoice,
    mentions: entry.mentions,
    sentiment: entry.sentiment,
  };
};
