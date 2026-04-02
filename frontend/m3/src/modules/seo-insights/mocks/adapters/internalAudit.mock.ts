export const internalAuditRawPayload = {
  findings: [
    {
      category: 'crawl_depth',
      url: 'https://example.com/deep-page',
      score: 62,
      timestamp: '2026-03-15T10:00:00.000Z',
    },
    {
      category: 'internal_linking',
      url: 'https://example.com/orphan-page',
      score: 40,
      timestamp: '2026-03-15T10:00:00.000Z',
    },
  ],
};
