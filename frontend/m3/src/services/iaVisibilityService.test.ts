import { beforeEach, describe, expect, it, vi } from 'vitest';

const httpGetMock = vi.fn();
const httpPostMock = vi.fn();
const legacyListMock = vi.fn();
const legacyRunMock = vi.fn();
const legacyHistoryMock = vi.fn();
const legacyConfigMock = vi.fn();
const legacySaveConfigMock = vi.fn();
const legacyScheduleMock = vi.fn();
const legacySaveScheduleMock = vi.fn();
const legacyToggleScheduleMock = vi.fn();

vi.mock('./httpClient', () => ({
  createHttpClient: () => ({
    get: httpGetMock,
    post: httpPostMock,
  }),
}));

vi.mock('./iaVisibilityLegacySource', () => ({
  getLegacyIAVisibilityList: legacyListMock,
  runLegacyIAVisibility: legacyRunMock,
  getLegacyIAVisibilityHistory: legacyHistoryMock,
  getLegacyIAVisibilityConfig: legacyConfigMock,
  saveLegacyIAVisibilityConfig: legacySaveConfigMock,
  getLegacyIAVisibilitySchedule: legacyScheduleMock,
  saveLegacyIAVisibilitySchedule: legacySaveScheduleMock,
  toggleLegacyIAVisibilitySchedule: legacyToggleScheduleMock,
}));

describe('iaVisibilityService.list', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete import.meta.env.VITE_IA_VISIBILITY_DATA_SOURCE;
    delete import.meta.env.VITE_FF_IA_VISIBILITY_BACKEND_SOURCE;
  });

  it('uses backend source by default', async () => {
    httpGetMock.mockResolvedValue({ clientId: 'client-1', items: [] });

    const { iaVisibilityService } = await import('./iaVisibilityService');
    await iaVisibilityService.list('client-1');

    expect(httpGetMock).toHaveBeenCalledOnce();
    expect(legacyListMock).not.toHaveBeenCalled();
  });

  it('uses legacy source when pilot flag sets legacy mode', async () => {
    import.meta.env.VITE_IA_VISIBILITY_DATA_SOURCE = 'legacy';
    legacyListMock.mockResolvedValue({ clientId: 'client-legacy', items: [] });

    const { iaVisibilityService } = await import('./iaVisibilityService');
    await iaVisibilityService.list('client-legacy');

    expect(legacyListMock).toHaveBeenCalledWith('client-legacy');
    expect(httpGetMock).not.toHaveBeenCalled();
  });

  it('uses legacy source across pilot endpoints when legacy mode is active', async () => {
    import.meta.env.VITE_IA_VISIBILITY_DATA_SOURCE = 'legacy';
    legacyHistoryMock.mockResolvedValue({ clientId: 'client-legacy', runs: [] });
    legacyConfigMock.mockResolvedValue({ status: 'ok', config: { clientId: 'client-legacy' } });
    legacyScheduleMock.mockResolvedValue({
      status: 'ok',
      clientId: 'client-legacy',
      schedule: { frequency: 'daily', timezone: 'UTC', runHour: 9, runMinute: 0, status: 'paused' },
    });
    legacyRunMock.mockResolvedValue({ clientId: 'client-legacy', mentions: 0, shareOfVoice: 0, sentiment: 0, competitorAppearances: {}, rawEvidence: [] });
    legacySaveConfigMock.mockResolvedValue({ status: 'ok', config: { clientId: 'client-legacy' } });
    legacySaveScheduleMock.mockResolvedValue({
      status: 'ok',
      clientId: 'client-legacy',
      schedule: { frequency: 'daily', timezone: 'UTC', runHour: 9, runMinute: 0, status: 'paused' },
    });
    legacyToggleScheduleMock.mockResolvedValue({
      status: 'ok',
      clientId: 'client-legacy',
      schedule: { frequency: 'daily', timezone: 'UTC', runHour: 9, runMinute: 0, status: 'active' },
    });

    const { iaVisibilityService } = await import('./iaVisibilityService');
    await iaVisibilityService.getHistory('client-legacy');
    await iaVisibilityService.getConfig('client-legacy');
    await iaVisibilityService.getSchedule('client-legacy');
    await iaVisibilityService.run({
      clientId: 'client-legacy',
      brand: 'Legacy Brand',
      competitors: [],
      promptTemplate: '',
      sources: [],
      providerPriority: [],
    });
    await iaVisibilityService.saveConfig('client-legacy', {
      clientId: 'client-legacy',
      brand: 'Legacy Brand',
      competitors: [],
      promptTemplate: '',
      sources: [],
      providerPriority: [],
    });
    await iaVisibilityService.saveSchedule('client-legacy', { frequency: 'daily' });
    await iaVisibilityService.toggleSchedule('client-legacy', 'resume');

    expect(httpGetMock).not.toHaveBeenCalled();
    expect(httpPostMock).not.toHaveBeenCalled();
    expect(legacyHistoryMock).toHaveBeenCalledWith('client-legacy');
    expect(legacyConfigMock).toHaveBeenCalledWith('client-legacy');
    expect(legacyScheduleMock).toHaveBeenCalledWith('client-legacy');
    expect(legacyRunMock).toHaveBeenCalledOnce();
    expect(legacySaveConfigMock).toHaveBeenCalledOnce();
    expect(legacySaveScheduleMock).toHaveBeenCalledWith('client-legacy', { frequency: 'daily' });
    expect(legacyToggleScheduleMock).toHaveBeenCalledWith('client-legacy', 'resume');
  });
});
