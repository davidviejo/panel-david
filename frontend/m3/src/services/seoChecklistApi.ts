import { createHttpClient } from './httpClient';
import { endpoints } from './endpoints';
import {
  SeoChecklistBulkUpdateRequestContract,
  SeoChecklistImportRequestContract,
  SeoChecklistListResponseContract,
  SeoChecklistMutationResponseContract,
  SeoChecklistUpdateRequestContract,
} from '../shared/api/contracts/seoChecklist';

const httpClient = createHttpClient({ service: 'api' });

export const seoChecklistApi = {
  list: (clientId: string) =>
    httpClient.get<SeoChecklistListResponseContract>(endpoints.seoChecklist.list(clientId)),

  importPages: (payload: SeoChecklistImportRequestContract) =>
    httpClient.post<SeoChecklistMutationResponseContract>(
      endpoints.seoChecklist.import(payload.clientId),
      payload,
    ),

  update: (payload: SeoChecklistUpdateRequestContract) =>
    httpClient.patch<SeoChecklistMutationResponseContract>(
      endpoints.seoChecklist.update(payload.clientId, payload.pageId),
      payload,
    ),

  bulkUpdate: (payload: SeoChecklistBulkUpdateRequestContract) =>
    httpClient.patch<SeoChecklistMutationResponseContract>(
      endpoints.seoChecklist.bulkUpdate(payload.clientId),
      payload,
    ),
};
