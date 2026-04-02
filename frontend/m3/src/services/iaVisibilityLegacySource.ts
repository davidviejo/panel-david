import { ClientRepository } from './clientRepository';
import { IAVisibilityListItem, IAVisibilityListResponse } from './iaVisibilityService';

const toLegacyListItem = (
  historyItem: {
    id: string;
    prompt: string;
    source?: string;
    createdAt: number;
  },
  index: number,
): IAVisibilityListItem => ({
  id: historyItem.id,
  keyword: historyItem.prompt?.trim() || 'Consulta histórica',
  url: historyItem.source || 'Sin URL asociada',
  position: index + 1,
  change: 0,
  status: 'stable',
  updatedAt: new Date(historyItem.createdAt).toISOString(),
});

export const getLegacyIAVisibilityList = async (clientId: string): Promise<IAVisibilityListResponse> => {
  const client = ClientRepository.getClients().find((item) => item.id === clientId);
  const history = client?.iaVisibility?.history || [];

  const items = [...history]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((entry, index) => toLegacyListItem(entry, index));

  return {
    clientId,
    items,
  };
};
