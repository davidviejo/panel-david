export const parseBrandTerms = (value: string): string[] =>
  value
    .split(/\r?\n|,|;/)
    .map((term) => term.trim())
    .filter(Boolean);

export const normalizeBrandTerm = (value: string) => value.trim().toLowerCase();

export const isBrandTermMatch = (keyword: string, brandTerms: string[] = []) => {
  const normalizedKeyword = normalizeBrandTerm(keyword);
  if (!normalizedKeyword) return false;

  return brandTerms.some((term) => normalizeBrandTerm(term) === normalizedKeyword);
};
