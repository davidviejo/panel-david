import { SeoPage } from '../../../types/seoChecklist';

export interface SeoChecklistListResponseContract {
  clientId: string;
  pages: SeoPage[];
  updatedAt?: string;
}

export interface SeoChecklistImportRequestContract {
  clientId: string;
  pages: SeoPage[];
}

export interface SeoChecklistUpdateRequestContract {
  clientId: string;
  pageId: string;
  changes: Partial<SeoPage>;
}

export interface SeoChecklistBulkUpdateItemContract {
  id: string;
  changes: Partial<SeoPage>;
}

export interface SeoChecklistBulkUpdateRequestContract {
  clientId: string;
  updates: SeoChecklistBulkUpdateItemContract[];
}

export interface SeoChecklistMutationResponseContract {
  clientId: string;
  pages: SeoPage[];
  updatedAt?: string;
}
