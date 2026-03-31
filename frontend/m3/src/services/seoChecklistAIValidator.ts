import { ChecklistKey, ChecklistStatus, normalizeChecklistStatus, SeoPage } from '../types/seoChecklist';
import { SettingsRepository } from './settingsRepository';
import { buildPendingChecks } from '../utils/seoChecklistAiValidation';
import { runChecklistHeuristics } from '../utils/checklistAiHeuristics';

interface AiValidationResult {
  key: ChecklistKey;
  status: ChecklistStatus;
  notes: string;
  error?: string;
}

interface AiValidationResponse {
  results: AiValidationResult[];
  globalErrors?: string[];
}

export interface SeoChecklistAiSummary {
  updatedChecks: Array<{ key: ChecklistKey; status: ChecklistStatus; notes: string }>;
  heuristicResolvedChecks: Array<{ key: ChecklistKey; status: ChecklistStatus; notes: string }>;
  pendingForAiChecks: ChecklistKey[];
  detectedErrors: string[];
  skippedSiChecks: ChecklistKey[];
  omittedBySi: number;
  attempted: number;
}

const resolveProvider = () => {
  const settings = SettingsRepository.getSettings();
  const openaiApiKey = SettingsRepository.getApiKey('openai');
  if (openaiApiKey) {
    return { provider: 'openai' as const, apiKey: openaiApiKey, model: settings.openaiModel || 'gpt-4o-mini' };
  }

  const geminiApiKey = SettingsRepository.getApiKey('gemini');
  if (geminiApiKey) {
    return { provider: 'gemini' as const, apiKey: geminiApiKey, model: settings.geminiModel || 'gemini-1.5-pro' };
  }

  const mistralApiKey = SettingsRepository.getApiKey('mistral');
  if (mistralApiKey) {
    return { provider: 'mistral' as const, apiKey: mistralApiKey, model: settings.mistralModel || 'mistral-large-latest' };
  }

  return null;
};

const parseAiResponse = (raw: string): AiValidationResponse => {
  const sanitized = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(sanitized) as AiValidationResponse;
};

const coerceStatus = (status: string): ChecklistStatus => {
  const normalized = normalizeChecklistStatus(status);
  if (normalized === 'SI') return 'SI_IA';
  return normalized;
};

export const validateChecklistWithAI = async (page: SeoPage): Promise<SeoChecklistAiSummary> => {
  const provider = resolveProvider();
  if (!provider) {
    throw new Error('No hay API key de IA configurada (OpenAI, Gemini o Mistral).');
  }

  const { pending, skippedSi } = buildPendingChecks(page);
  const heuristicRun = runChecklistHeuristics(page, pending);
  const heuristicResolvedChecks = heuristicRun.resolvedByHeuristics.map(({ key, status, notes }) => ({
    key,
    status,
    notes,
  }));

  if (heuristicRun.pendingForAI.length === 0) {
    return {
      updatedChecks: [...heuristicResolvedChecks],
      heuristicResolvedChecks,
      pendingForAiChecks: [],
      detectedErrors: [],
      skippedSiChecks: skippedSi.map((item) => item.key),
      omittedBySi: skippedSi.length,
      attempted: heuristicRun.pendingForAI.length,
    };
  }

  const checksPayload = heuristicRun.pendingForAI.map((item) => ({
    key: item.key,
    label: item.label,
    priority: item.priority,
    current_status: item.status_manual,
    notes: item.notes_manual,
    recommendation: item.recommendation || '',
    autoData: item.autoData || null,
  }));

  const prompt = `Eres un auditor SEO senior. Evalúa los checks y responde SOLO JSON válido.

URL: ${page.url}
Keyword principal: ${page.kwPrincipal || 'N/A'}
Tipo de página: ${page.pageType}

Checks pendientes (ordenados por prioridad alta > media > baja):
${JSON.stringify(checksPayload, null, 2)}

Reglas:
1) No incluyas checks fuera de la lista.
2) Devuelve status recomendado por check usando SOLO: SI_IA, PARCIAL, NO, ERROR_CLARO_IA, NA.
3) Si detectas un error técnico claro, usa ERROR_CLARO_IA y explica el error en "error".
4) notes debe ser concreto y accionable (máx. 180 caracteres).
5) Si no hay suficiente evidencia, usa PARCIAL o NA, nunca inventes.

Formato de salida:
{
  "results": [
    {"key": "CONTENIDOS", "status": "PARCIAL", "notes": "...", "error": "... opcional"}
  ],
  "globalErrors": ["... opcional ..."]
}`;

  let rawResponse = '';
  if (provider.provider === 'openai') {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: provider.apiKey, dangerouslyAllowBrowser: true });
    const response = await client.chat.completions.create({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });
    rawResponse = response.choices[0]?.message?.content || '';
  } else if (provider.provider === 'gemini') {
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey: provider.apiKey });
    const response = await client.models.generateContent({
      model: provider.model,
      contents: prompt,
    });
    rawResponse = response.text || '';
  } else {
    const { Mistral } = await import('@mistralai/mistralai');
    const client = new Mistral({ apiKey: provider.apiKey });
    const response = await client.chat.complete({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });
    rawResponse = (response.choices?.[0]?.message?.content as string) || '';
  }

  if (!rawResponse) {
    throw new Error('La IA no devolvió respuesta.');
  }

  let parsed: AiValidationResponse;
  try {
    parsed = parseAiResponse(rawResponse);
  } catch {
    throw new Error('La respuesta de IA no pudo parsearse como JSON válido.');
  }

  const pendingByKey = new Map(heuristicRun.pendingForAI.map((item) => [item.key, item]));
  const updatedChecks = (parsed.results || [])
    .filter((item) => pendingByKey.has(item.key))
    .map((item) => ({
      key: item.key,
      status: coerceStatus(item.status),
      notes: (item.notes || '').trim(),
      error: (item.error || '').trim(),
    }))
    .filter((item) => item.status !== 'NA' || item.notes.length > 0)
    .map(({ key, status, notes }) => ({ key, status, notes }));

  const detectedErrors = [
    ...(parsed.globalErrors || []),
    ...(parsed.results || [])
      .filter((item) => item.error && pendingByKey.has(item.key))
      .map((item) => `${item.key}: ${item.error}`),
  ];

  return {
    updatedChecks: [...heuristicResolvedChecks, ...updatedChecks],
    heuristicResolvedChecks,
    pendingForAiChecks: heuristicRun.pendingForAI.map((item) => item.key),
    detectedErrors,
    skippedSiChecks: skippedSi.map((item) => item.key),
    omittedBySi: skippedSi.length,
    attempted: heuristicRun.pendingForAI.length,
  };
};
