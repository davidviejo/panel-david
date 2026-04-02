import { describe, expect, it } from 'vitest';
import { buildModuleScopeKey, buildQueryKey } from './queryKeys';

describe('queryKeys helpers', () => {
  it('builds query key with module/resource/params hierarchy', () => {
    expect(buildQueryKey('seoChecklist', 'list', { clientId: 'client-1' })).toEqual([
      'seoChecklist',
      'list',
      { clientId: 'client-1' },
    ]);
  });

  it('builds resource key without params when not provided', () => {
    expect(buildQueryKey('gsc', 'sites')).toEqual(['gsc', 'sites']);
  });

  it('builds module scope key with params', () => {
    expect(buildModuleScopeKey('iaVisibility', { clientId: 'c-1' })).toEqual([
      'iaVisibility',
      'scope',
      { clientId: 'c-1' },
    ]);
  });
});
