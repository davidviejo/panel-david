import { createHttpClient } from './httpClient';
import { endpoints } from './endpoints';
import { ProjectOverviewResponseContract } from '../shared/api/contracts/projectOverview';
import { parseProjectOverviewContract } from '../shared/api/mappers/projectOverviewMapper';

interface AuthResponse {
  token?: string;
  role: string;
  scope?: string;
  error?: string;
}

interface SessionResponse {
  authenticated: boolean;
  role?: string;
  scope?: string | null;
}

const httpClient = createHttpClient({ service: 'api' });

export const api = {
  authClientsArea: async (password: string): Promise<AuthResponse> =>
    httpClient.post<AuthResponse>(endpoints.auth.clientsArea(), { password }, { includeAuth: false }),

  authProject: async (slug: string, password: string): Promise<AuthResponse> =>
    httpClient.post<AuthResponse>(endpoints.auth.project(slug), { password }, { includeAuth: false }),

  authOperator: async (password: string): Promise<AuthResponse> =>
    httpClient.post<AuthResponse>(endpoints.auth.operator(), { password }, { includeAuth: false }),

  getSession: async (): Promise<SessionResponse> =>
    httpClient.get<SessionResponse>(endpoints.auth.session(), { onUnauthorizedRedirect: false }),

  logout: async (redirectTo = '/'): Promise<void> => {
    try {
      await httpClient.post(endpoints.auth.logout(), undefined, {
        includeAuth: false,
        onUnauthorizedRedirect: false,
      });
    } finally {
      window.location.hash = `#${redirectTo}`;
    }
  },

  getClients: async () => httpClient.get(endpoints.clients.list()),

  getPublicClients: async () => httpClient.get(endpoints.clients.listPublic(), { includeAuth: false }),

  getProjectOverview: async (slug: string): Promise<ProjectOverviewResponseContract> => {
    const payload = await httpClient.get<unknown>(endpoints.clients.projectOverview(slug));
    const parsed = parseProjectOverviewContract(payload);
    if (!parsed) {
      throw new Error('Invalid overview contract response');
    }
    return parsed;
  },

  runOperatorTool: async (tool: string) =>
    httpClient.post(endpoints.tools.run(tool), undefined),
};
