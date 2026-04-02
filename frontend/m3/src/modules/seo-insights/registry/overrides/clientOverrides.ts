import type { AnalysisType } from '../../enums/analysis-type';

export type OverrideMode = 'replace' | 'append';

export interface ClientOverrideRule {
  clientId: string;
  analysisType: AnalysisType;
  tools: string[];
  mode?: OverrideMode;
}

/**
 * Reglas por cliente (máxima prioridad frente a sector/base).
 */
export const CLIENT_OVERRIDES: ClientOverrideRule[] = [
  {
    clientId: 'priority-client-demo',
    analysisType: 'manual',
    tools: ['custom_playbook_tool', 'schema_tool'],
    mode: 'replace',
  },
];
