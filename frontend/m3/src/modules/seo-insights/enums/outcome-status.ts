export const outcome_status = ['pending', 'improved', 'unchanged', 'regressed'] as const;

export type OutcomeStatus = (typeof outcome_status)[number];
