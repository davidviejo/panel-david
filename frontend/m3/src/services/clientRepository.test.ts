import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ClientRepository } from './clientRepository';

vi.mock('../strategies/StrategyFactory', () => ({
  StrategyFactory: {
    getStrategy: vi.fn().mockReturnValue({
      getModules: () => [
        { id: 8, title: 'Extras', subtitle: '', levelRange: '', description: '', iconName: '', tasks: [] },
        { id: 9, title: 'MIA', subtitle: '', levelRange: '', description: '', iconName: '', tasks: [] },
      ],
    }),
  },
}));

describe('ClientRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes legacy frontend verticals to media when restoring saved clients', () => {
    localStorage.setItem(
      'mediaflow_clients',
      JSON.stringify([
        {
          id: 'frontend-project',
          name: 'Frontend Project',
          vertical: 'frontend',
          modules: [],
          createdAt: Date.now(),
        },
      ]),
    );

    const clients = ClientRepository.getClients();

    expect(clients[0].vertical).toBe('media');
  });

  it('saves clients with unsupported verticals normalized to media', () => {
    ClientRepository.saveClients([
      {
        id: 'frontend-project',
        name: 'Frontend Project',
        vertical: 'frontend' as never,
        modules: [],
        createdAt: Date.now(),
      },
    ]);

    const saved = JSON.parse(localStorage.getItem('mediaflow_clients') || '[]');

    expect(saved[0].vertical).toBe('media');
  });
});
