import { ClientRepository } from './clientRepository';
import {
  IAVisibilityConfigResponseContract,
  IAVisibilityHistoryResponseContract,
  IAVisibilityRunRequestContract,
  IAVisibilityRunResponseContract,
  IAVisibilityScheduleContract,
  IAVisibilityScheduleResponseContract,
} from '../shared/api/contracts/iaVisibility';
import { IAVisibilityListItem, IAVisibilityListResponse } from './iaVisibilityService';

const LEGACY_SCHEDULE_KEY = 'mediaflow_ia_visibility_schedule';

const DEFAULT_LEGACY_SCHEDULE: IAVisibilityScheduleContract = {
  frequency: 'daily',
  timezone: 'UTC',
  runHour: 9,
  runMinute: 0,
  status: 'paused',
};

const toLegacyListItem = (
  historyItem: {
    id: string;
    prompt: string;
    source?: string;
    createdAt: number;
  },
  index: number,
): IAVisibilityListItem => ({
  id: historyItem.id,
  keyword: historyItem.prompt?.trim() || 'Consulta histórica',
  url: historyItem.source || 'Sin URL asociada',
  position: index + 1,
  change: 0,
  status: 'stable',
  updatedAt: new Date(historyItem.createdAt).toISOString(),
});

export const getLegacyIAVisibilityList = async (clientId: string): Promise<IAVisibilityListResponse> => {
  const client = ClientRepository.getClients().find((item) => item.id === clientId);
  const history = client?.iaVisibility?.history || [];

  const items = [...history]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((entry, index) => toLegacyListItem(entry, index));

  return {
    clientId,
    items,
  };
};

const toLegacyRunResponse = (
  item: {
    id: string;
    createdAt: number;
    competitorMentions: Array<{ competitor: string; mentions: number }>;
    sentimentSummary: { positive: number; neutral: number; negative: number };
  },
): IAVisibilityRunResponseContract => {
  const mentions = item.competitorMentions.reduce((total, mention) => total + (mention.mentions || 0), 0);
  const sentimentBase =
    item.sentimentSummary.positive + item.sentimentSummary.neutral + item.sentimentSummary.negative;
  const sentiment = sentimentBase === 0
    ? 0
    : (item.sentimentSummary.positive - item.sentimentSummary.negative) / sentimentBase;

  return {
    clientId: '',
    version: 1,
    runTrigger: 'manual',
    mentions,
    shareOfVoice: 0,
    sentiment,
    competitorAppearances: Object.fromEntries(
      item.competitorMentions.map((mention) => [mention.competitor, mention.mentions || 0]),
    ),
    rawEvidence: [{ legacyHistoryId: item.id, createdAt: item.createdAt }],
    providerUsed: 'legacy',
  };
};

export const getLegacyIAVisibilityHistory = async (
  clientId: string,
): Promise<IAVisibilityHistoryResponseContract> => {
  const client = ClientRepository.getClients().find((item) => item.id === clientId);
  const history = client?.iaVisibility?.history || [];

  return {
    clientId,
    runs: [...history]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((item) => ({ ...toLegacyRunResponse(item), clientId })),
  };
};

export const getLegacyIAVisibilityConfig = async (
  clientId: string,
): Promise<IAVisibilityConfigResponseContract> => {
  const client = ClientRepository.getClients().find((item) => item.id === clientId);
  const config = client?.iaVisibility?.config;

  return {
    status: 'ok',
    config: {
      clientId,
      brand: client?.name || '',
      competitors: config?.competitors || [],
      promptTemplate: config?.prompts?.[0] || '',
      sources: [],
      providerPriority: ['legacy'],
      updatedAt: new Date().toISOString(),
    },
  };
};

export const saveLegacyIAVisibilityConfig = async (
  clientId: string,
  payload: IAVisibilityRunRequestContract,
): Promise<IAVisibilityConfigResponseContract> => {
  const clients = ClientRepository.getClients();
  const now = new Date().toISOString();
  const updatedClients = clients.map((client) => {
    if (client.id !== clientId || !client.iaVisibility) return client;

    return {
      ...client,
      iaVisibility: {
        ...client.iaVisibility,
        config: {
          ...client.iaVisibility.config,
          competitors: payload.competitors,
          prompts: payload.promptTemplate ? [payload.promptTemplate] : [],
        },
      },
    };
  });
  ClientRepository.saveClients(updatedClients);

  return {
    status: 'ok',
    config: {
      ...payload,
      updatedAt: now,
    },
  };
};

export const runLegacyIAVisibility = async (
  payload: IAVisibilityRunRequestContract,
): Promise<IAVisibilityRunResponseContract> => {
  const response: IAVisibilityRunResponseContract = {
    clientId: payload.clientId,
    version: 1,
    runTrigger: 'manual',
    mentions: 0,
    shareOfVoice: 0,
    sentiment: 0,
    competitorAppearances: Object.fromEntries(payload.competitors.map((competitor) => [competitor, 0])),
    rawEvidence: [{ source: 'legacy-fallback', generatedAt: new Date().toISOString() }],
    providerUsed: 'legacy',
  };

  const clients = ClientRepository.getClients();
  const updatedClients = clients.map((client) => {
    if (client.id !== payload.clientId || !client.iaVisibility) return client;

    return {
      ...client,
      iaVisibility: {
        ...client.iaVisibility,
        history: [
          {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            prompt: payload.promptTemplate,
            answer: 'Ejecución registrada en modo legacy.',
            source: 'legacy-fallback',
            competitorMentions: payload.competitors.map((competitor) => ({
              competitor,
              mentions: 0,
              sentiment: 'neutral',
            })),
            sentimentSummary: { positive: 0, neutral: 0, negative: 0 },
          },
          ...client.iaVisibility.history,
        ],
      },
    };
  });
  ClientRepository.saveClients(updatedClients);

  return response;
};

const readLegacySchedule = (): IAVisibilityScheduleContract => {
  const stored = localStorage.getItem(LEGACY_SCHEDULE_KEY);
  if (!stored) return { ...DEFAULT_LEGACY_SCHEDULE };

  try {
    const parsed = JSON.parse(stored) as Partial<IAVisibilityScheduleContract>;
    return {
      frequency: parsed.frequency === 'weekly' ? 'weekly' : 'daily',
      timezone: typeof parsed.timezone === 'string' && parsed.timezone ? parsed.timezone : 'UTC',
      runHour: typeof parsed.runHour === 'number' ? parsed.runHour : 9,
      runMinute: typeof parsed.runMinute === 'number' ? parsed.runMinute : 0,
      status: parsed.status === 'active' ? 'active' : 'paused',
      lastRunAt: typeof parsed.lastRunAt === 'string' ? parsed.lastRunAt : undefined,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
    };
  } catch {
    return { ...DEFAULT_LEGACY_SCHEDULE };
  }
};

const persistLegacySchedule = (schedule: IAVisibilityScheduleContract): IAVisibilityScheduleContract => {
  const nextSchedule = {
    ...schedule,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LEGACY_SCHEDULE_KEY, JSON.stringify(nextSchedule));
  return nextSchedule;
};

export const getLegacyIAVisibilitySchedule = async (
  clientId: string,
): Promise<IAVisibilityScheduleResponseContract> => ({
  status: 'ok',
  clientId,
  schedule: readLegacySchedule(),
});

export const saveLegacyIAVisibilitySchedule = async (
  clientId: string,
  payload: Partial<IAVisibilityScheduleContract>,
): Promise<IAVisibilityScheduleResponseContract> => {
  const merged = { ...readLegacySchedule(), ...payload };
  return {
    status: 'ok',
    clientId,
    schedule: persistLegacySchedule(merged),
  };
};

export const toggleLegacyIAVisibilitySchedule = async (
  clientId: string,
  action: 'pause' | 'resume',
): Promise<IAVisibilityScheduleResponseContract> => {
  const current = readLegacySchedule();
  const status = action === 'resume' ? 'active' : 'paused';

  return {
    status: 'ok',
    clientId,
    schedule: persistLegacySchedule({ ...current, status }),
  };
};
