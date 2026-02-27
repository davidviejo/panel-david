import { SeoPage, ChecklistKey, AnalysisConfigPayload } from '../types/seoChecklist';
import { analyzeUrl, AnalysisResponse } from '../services/pythonEngineClient';
import { getPageQueries } from '../services/googleSearchConsole';

export const processAnalysisResult = (
  page: SeoPage,
  result: AnalysisResponse,
  gscQueries: any[] = [],
): Partial<SeoPage> => {
  // FIX: Sync LocalBusiness from DATOS_ESTRUCTURADOS to GEOLOCALIZACION
  // If structured data sees LocalBusiness, GEOLOCALIZACION should also reflect it.
  if (result.items) {
    const structData = result.items.DATOS_ESTRUCTURADOS?.autoData;
    if (structData?.schemasParsed && Array.isArray(structData.schemasParsed)) {
      const hasLocalBusiness = structData.schemasParsed.some((s: any) => {
        if (typeof s === 'string') return s.includes('LocalBusiness');
        if (typeof s === 'object' && s !== null && s['@type']) {
          const type = s['@type'];
          if (typeof type === 'string') {
            return type.includes('LocalBusiness');
          }
          if (Array.isArray(type)) {
            return type.some((t: any) => typeof t === 'string' && t.includes('LocalBusiness'));
          }
        }
        return false;
      });

      if (hasLocalBusiness) {
        if (!result.items.GEOLOCALIZACION) {
          result.items.GEOLOCALIZACION = {};
        }
        if (!result.items.GEOLOCALIZACION.autoData) {
          result.items.GEOLOCALIZACION.autoData = {};
        }
        result.items.GEOLOCALIZACION.autoData.localBusiness = true;
      }
    }
  }

  // Inject GSC Data into OPORTUNIDADES if provided and not already present in result
  // If the result came from a batch job that already included GSC data, we might want to skip this,
  // but usually gscQueries here are passed from the client or empty.
  // If result already has it, we should probably respect it, but the original code overwrote it.
  // We'll follow the original logic: ensure the structure exists, then inject/overwrite if gscQueries is not empty.

  if (gscQueries.length > 0 || !result.items?.OPORTUNIDADES?.autoData?.gscQueries) {
      if (!result.items) {
          result.items = {};
      }
      if (!result.items.OPORTUNIDADES) {
        result.items.OPORTUNIDADES = {};
      }
      if (!result.items.OPORTUNIDADES.autoData) {
        result.items.OPORTUNIDADES.autoData = {};
      }

      if (gscQueries.length > 0) {
        result.items.OPORTUNIDADES.autoData.gscQueries = gscQueries;
      }

      // Calculate kwFound if GSC data is present (either just injected or already there)
      const currentGscQueries = result.items.OPORTUNIDADES.autoData.gscQueries || [];
      if (currentGscQueries.length > 0) {
          const normalizedKw = page.kwPrincipal.toLowerCase().trim();
          const kwFound = currentGscQueries.some(
            (q: any) => q.keys && q.keys[0] && q.keys[0].toLowerCase().trim() === normalizedKw,
          );
          result.items.OPORTUNIDADES.autoData.kwPrincipalInGSC = kwFound;
      }
  }

  const updates: Partial<SeoPage> = {
    lastAnalyzedAt: Date.now(),
    checklist: { ...page.checklist },
    advancedBlockedReason: result.advancedBlockedReason,
    engineMeta: result.engineMeta,
  };

  if (result.items) {
    Object.entries(result.items).forEach(([k, v]) => {
      const key = k as ChecklistKey;
      if (updates.checklist) {
        if (!updates.checklist[key]) {
           updates.checklist[key] = {
             key: key,
             label: key,
             status_manual: 'NA',
             notes_manual: '',
           };
        }
        // Deep merge of the checklist item is NOT done for autoData in the original code,
        // it replaced the properties spread from `v`.
        // `v` contains { autoData, recommendation, suggested_status }
        // The original code:
        // updates.checklist[key] = {
        //   ...updates.checklist[key],
        //   ...v,
        //   suggested_status: v.suggested_status as any,
        // };
        // This preserves status_manual and notes_manual from `updates.checklist[key]` (which is from `page.checklist`),
        // and overwrites autoData, recommendation, etc. from `v`.

        updates.checklist[key] = {
          ...updates.checklist[key],
          ...v,
          suggested_status: v.suggested_status as any,
        };
      }
    });
  }

  return updates;
};

export const runPageAnalysis = async (
  page: SeoPage,
  analysisConfig?: AnalysisConfigPayload,
): Promise<Partial<SeoPage>> => {
  let gscQueries: any[] = [];

  // Check if page already has GSC data (to avoid re-fetching and respect limits)
  if (
    page.checklist.OPORTUNIDADES?.autoData?.gscQueries &&
    Array.isArray(page.checklist.OPORTUNIDADES.autoData.gscQueries) &&
    page.checklist.OPORTUNIDADES.autoData.gscQueries.length > 0
  ) {
    gscQueries = page.checklist.OPORTUNIDADES.autoData.gscQueries;
  } else {
    const token = localStorage.getItem('mediaflow_gsc_token');
    const site = localStorage.getItem('mediaflow_gsc_selected_site');

    if (token && site) {
      try {
        const end = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        // Limit to 50 as requested
        gscQueries = await getPageQueries(token, site, page.url, start, end, 50);
      } catch (e) {
        console.warn('Could not fetch GSC queries', e);
      }
    }
  }

  const result = await analyzeUrl({
    url: page.url,
    kwPrincipal: page.kwPrincipal,
    pageType: page.pageType,
    geoTarget: page.geoTarget,
    cluster: page.cluster,
    pageId: page.id,
    gscQueries,
    analysisConfig,
  });

  return processAnalysisResult(page, result, gscQueries);
};
