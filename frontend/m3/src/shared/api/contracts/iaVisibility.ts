export type IAVisibilityRunTrigger = 'manual' | 'scheduled';

export interface IAVisibilityRunRequestContract {
  clientId: string;
  brand: string;
  competitors: string[];
  promptTemplate: string;
  sources: string[];
  providerPriority: string[];
}

export interface IAVisibilityRunResponseContract {
  clientId: string;
  version?: number;
  runTrigger?: IAVisibilityRunTrigger;
  mentions: number;
  shareOfVoice: number;
  sentiment: number;
  competitorAppearances: Record<string, number>;
  rawEvidence: Array<Record<string, unknown>>;
  providerUsed?: string;
}

export interface IAVisibilityConfigResponseContract {
  status: 'ok';
  config: IAVisibilityRunRequestContract & {
    updatedAt?: string;
  };
}

export interface IAVisibilityHistoryResponseContract {
  clientId: string;
  runs: IAVisibilityRunResponseContract[];
}

export interface IAVisibilityScheduleContract {
  frequency: 'daily' | 'weekly';
  timezone: string;
  runHour: number;
  runMinute: number;
  status: 'active' | 'paused';
  lastRunAt?: string;
  updatedAt?: string;
}

export interface IAVisibilityScheduleResponseContract {
  status?: 'ok';
  clientId: string;
  schedule: IAVisibilityScheduleContract;
}
