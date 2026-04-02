export const status = ['open', 'in_progress', 'resolved', 'ignored'] as const;

export type Status = (typeof status)[number];
