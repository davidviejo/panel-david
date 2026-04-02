import { analysis_type, type AnalysisType } from '../enums/analysis-type';
import { severity, type Severity } from '../enums/severity';

const normalizeValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const parseAnalysisType = (
  value: unknown,
  fallback: AnalysisType = 'manual',
): AnalysisType => {
  const normalized = normalizeValue(value);

  if ((analysis_type as readonly string[]).includes(normalized)) {
    return normalized as AnalysisType;
  }

  return fallback;
};

export const parseSeverity = (
  value: unknown,
  fallback: Severity = 'medium',
): Severity => {
  const normalized = normalizeValue(value);

  if ((severity as readonly string[]).includes(normalized)) {
    return normalized as Severity;
  }

  return fallback;
};
