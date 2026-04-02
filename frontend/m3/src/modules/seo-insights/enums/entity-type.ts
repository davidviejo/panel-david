export const entity_type = ['keyword', 'page', 'site'] as const;

export type EntityType = (typeof entity_type)[number];
