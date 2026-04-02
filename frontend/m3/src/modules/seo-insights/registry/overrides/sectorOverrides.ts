import type { AnalysisType } from '../../enums/analysis-type';

export type OverrideMode = 'replace' | 'append';

export interface SectorOverrideRule {
  sectorId: string;
  analysisType: AnalysisType;
  tools: string[];
  mode?: OverrideMode;
}

/**
 * Reglas base por sector.
 * Se deja como placeholder hasta cargar IDs reales desde backend/config.
 */
export const SECTOR_OVERRIDES: SectorOverrideRule[] = [
  {
    sectorId: 'ecommerce',
    analysisType: 'full',
    tools: ['feed_optimizer_tool', 'merchant_center_audit_tool'],
    mode: 'append',
  },
  {
    sectorId: 'saas',
    analysisType: 'incremental',
    tools: ['onboarding_funnel_tool'],
    mode: 'append',
  },
];
