import { CHECKLIST_POINTS, ChecklistKey, SeoPage } from '../types/seoChecklist';

export type ChecklistPriority = 'alta' | 'media' | 'baja';

const PRIORITY_ORDER: Record<ChecklistPriority, number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

const CHECK_PRIORITY: Record<ChecklistKey, ChecklistPriority> = {
  CLUSTER: 'media',
  GEOLOCALIZACION: 'media',
  DATOS_ESTRUCTURADOS: 'alta',
  CONTENIDOS: 'alta',
  SNIPPETS: 'alta',
  IMAGENES: 'media',
  ENLAZADO_INTERNO: 'media',
  ESTRUCTURA: 'media',
  UX: 'media',
  WPO: 'alta',
  ENLACE: 'baja',
  OPORTUNIDADES: 'alta',
  SEMANTICA: 'alta',
  GEO_IMAGENES: 'baja',
  CTA: 'media',
};

export interface PendingChecksPlan {
  orderedPendingChecks: ChecklistKey[];
  omittedChecks: ChecklistKey[];
}

export const buildPendingChecksPlan = (page: SeoPage): PendingChecksPlan => {
  const orderedByChecklist = CHECKLIST_POINTS.map((point) => point.key);
  const omittedChecks = orderedByChecklist.filter((key) => page.checklist[key]?.status_manual === 'SI');
  const pendingChecks = orderedByChecklist.filter((key) => page.checklist[key]?.status_manual !== 'SI');

  const orderedPendingChecks = pendingChecks.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[CHECK_PRIORITY[a]] - PRIORITY_ORDER[CHECK_PRIORITY[b]];
    if (priorityDiff !== 0) return priorityDiff;
    return orderedByChecklist.indexOf(a) - orderedByChecklist.indexOf(b);
  });

  return {
    orderedPendingChecks,
    omittedChecks,
  };
};
