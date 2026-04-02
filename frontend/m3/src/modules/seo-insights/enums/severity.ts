export const severity = ['low', 'medium', 'high', 'critical'] as const;

export type Severity = (typeof severity)[number];
