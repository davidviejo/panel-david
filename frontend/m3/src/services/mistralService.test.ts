import { describe, it, expect, vi } from 'vitest';
import { enhanceTaskWithMistral, isMistralConfigured } from './mistralService';
import { Task } from '../types';

describe('Mistral Service', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    impact: 'High',
    status: 'pending',
    category: 'Test',
  };

  it('should return error message when API key is missing', async () => {
    // Mock import.meta.env
    vi.stubGlobal('import', { meta: { env: { VITE_MISTRAL_API_KEY: '' } } });

    const result = await enhanceTaskWithMistral(mockTask, 'media');
    expect(result).toContain('API Key de Mistral no configurada');
  });

  it('should return false for configuration check when missing', () => {
    vi.stubGlobal('import', { meta: { env: { VITE_MISTRAL_API_KEY: '' } } });
    expect(isMistralConfigured()).toBe(false);
  });
});
