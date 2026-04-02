import {
  CHECKLIST_POINTS,
  ChecklistItem,
  ChecklistKey,
  ChecklistStatus,
  SeoPage,
  normalizeChecklistStatus,
} from '../../../types/seoChecklist';
import { isBrandTermMatch } from '../../../utils/brandTerms';

const normalizeKeyword = (keyword?: string) => (keyword || '').trim().toLowerCase();
const isUsableKeyword = (keyword?: string) => {
  const normalized = normalizeKeyword(keyword);
  return Boolean(normalized) && normalized !== '-';
};

const getKeywordCandidate = (page: SeoPage) => {
  if (isUsableKeyword(page.kwPrincipal)) {
    return page.kwPrincipal.trim();
  }

  if (isUsableKeyword(page.originalKwPrincipal)) {
    return page.originalKwPrincipal!.trim();
  }

  return '';
};

const getPagePerformanceScore = (page: SeoPage) => {
  const clicks = page.gscMetrics?.clicks || 0;
  const impressions = page.gscMetrics?.impressions || 0;
  const position = page.gscMetrics?.position ?? Number.POSITIVE_INFINITY;

  return { clicks, impressions, position };
};

const shouldKeepKeywordOver = (candidate: SeoPage, currentWinner: SeoPage) => {
  const candidateScore = getPagePerformanceScore(candidate);
  const winnerScore = getPagePerformanceScore(currentWinner);

  if (candidateScore.clicks !== winnerScore.clicks) {
    return candidateScore.clicks > winnerScore.clicks;
  }

  if (candidateScore.impressions !== winnerScore.impressions) {
    return candidateScore.impressions > winnerScore.impressions;
  }

  if (candidateScore.position !== winnerScore.position) {
    return candidateScore.position < winnerScore.position;
  }

  return candidate.id < currentWinner.id;
};

export const buildFallbackChecklistItem = (key: ChecklistKey): ChecklistItem => {
  const point = CHECKLIST_POINTS.find((item) => item.key === key);
  return {
    key,
    label: point?.label || key,
    status_manual: 'NA',
    notes_manual: '',
  };
};

export const normalizeChecklist = (checklist?: Partial<Record<ChecklistKey, ChecklistItem>>) =>
  CHECKLIST_POINTS.reduce(
    (acc, point) => {
      const existing = checklist?.[point.key];
      acc[point.key] = existing
        ? {
            ...buildFallbackChecklistItem(point.key),
            ...existing,
            status_manual: normalizeChecklistStatus(existing.status_manual),
          }
        : buildFallbackChecklistItem(point.key);
      return acc;
    },
    {} as Record<ChecklistKey, ChecklistItem>,
  );

export const normalizeSeoPage = (page: SeoPage): SeoPage => ({
  ...page,
  checklist: normalizeChecklist(page.checklist),
});

export const normalizeSeoPages = (pages: SeoPage[]) => pages.map(normalizeSeoPage);

const AI_DRIVEN_STATUSES = new Set<ChecklistStatus>(['SI_IA', 'ERROR_CLARO_IA']);

const isProtectedManualSiOverwrite = (
  currentStatus: ChecklistItem['status_manual'],
  nextStatus?: ChecklistItem['status_manual'],
) => currentStatus === 'SI' && Boolean(nextStatus) && AI_DRIVEN_STATUSES.has(nextStatus!);

export const mergeChecklistItemWithBusinessRules = (
  currentItem: ChecklistItem,
  incomingUpdates: Partial<ChecklistItem>,
): ChecklistItem => {
  if (!isProtectedManualSiOverwrite(currentItem.status_manual, incomingUpdates.status_manual)) {
    return { ...currentItem, ...incomingUpdates };
  }

  const { status_manual: _statusManual, notes_manual: _notesManual, ...rest } = incomingUpdates;
  return { ...currentItem, ...rest };
};

export const mergeChecklistWithBusinessRules = (
  currentChecklist: Record<ChecklistKey, ChecklistItem>,
  incomingChecklist?: Partial<Record<ChecklistKey, ChecklistItem>>,
) => {
  if (!incomingChecklist) return currentChecklist;

  return CHECKLIST_POINTS.reduce(
    (acc, point) => {
      const currentItem = currentChecklist[point.key] || buildFallbackChecklistItem(point.key);
      const incomingItem = incomingChecklist[point.key];
      acc[point.key] = incomingItem
        ? mergeChecklistItemWithBusinessRules(currentItem, incomingItem)
        : currentItem;
      return acc;
    },
    {} as Record<ChecklistKey, ChecklistItem>,
  );
};

export const enforceUniquePrimaryKeywords = (pages: SeoPage[], brandTerms: string[] = []) => {
  const winners = new Map<string, string>();

  pages.forEach((page) => {
    const keywordCandidate = getKeywordCandidate(page);
    const isBrandKeywordCandidate = isBrandTermMatch(keywordCandidate, brandTerms);
    const isBrandPage = Boolean(page.isBrandKeyword || isBrandKeywordCandidate);

    if (isBrandPage) return;

    const normalizedKeyword = normalizeKeyword(keywordCandidate);
    if (!isUsableKeyword(keywordCandidate)) return;

    const currentWinnerId = winners.get(normalizedKeyword);
    if (!currentWinnerId) {
      winners.set(normalizedKeyword, page.id);
      return;
    }

    const currentWinner = pages.find((candidate) => candidate.id === currentWinnerId);
    if (!currentWinner || shouldKeepKeywordOver(page, currentWinner)) {
      winners.set(normalizedKeyword, page.id);
    }
  });

  return pages.map((page) => {
    const keywordCandidate = getKeywordCandidate(page);
    const isBrandKeywordCandidate = isBrandTermMatch(keywordCandidate, brandTerms);
    const isBrandPage = Boolean(page.isBrandKeyword || isBrandKeywordCandidate);
    const normalizedKeyword = normalizeKeyword(keywordCandidate);
    const nextOriginalKeyword = isUsableKeyword(keywordCandidate) ? keywordCandidate : undefined;

    if (isBrandPage) {
      return {
        ...page,
        kwPrincipal: '',
        originalKwPrincipal: nextOriginalKeyword,
        isBrandKeyword: true,
      };
    }

    if (!isUsableKeyword(keywordCandidate)) {
      return {
        ...page,
        originalKwPrincipal: nextOriginalKeyword,
      };
    }

    if (winners.get(normalizedKeyword) === page.id) {
      return {
        ...page,
        kwPrincipal: keywordCandidate,
        originalKwPrincipal: keywordCandidate,
      };
    }

    return {
      ...page,
      kwPrincipal: '',
      originalKwPrincipal: keywordCandidate,
    };
  });
};
