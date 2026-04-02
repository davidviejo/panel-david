import { createHttpClient } from './httpClient';
import { endpoints } from './endpoints';

interface AuthResponse {
  authenticated: boolean;
  role: string;
  scope?: string;
  error?: string;
}

const httpClient = createHttpClient({ service: 'api' });

export const api = {
  authClientsArea: async (password: string): Promise<AuthResponse> => {
    const data = await httpClient.post<AuthResponse>(endpoints.auth.clientsArea(), { password }, { includeAuth: false });
    return data;
  },

  authProject: async (slug: string, password: string): Promise<AuthResponse> => {
    const data = await httpClient.post<AuthResponse>(endpoints.auth.project(slug), { password }, { includeAuth: false });
    return data;
  },

  authOperator: async (password: string): Promise<AuthResponse> => {
    const data = await httpClient.post<AuthResponse>(endpoints.auth.operator(), { password }, { includeAuth: false });
    return data;
  },

  logout: async () => {
    await httpClient.post(endpoints.auth.logout());
    window.location.href = '/';
  },

  getSession: async () => httpClient.get<AuthResponse>(endpoints.auth.session()),

  getClients: async () => httpClient.get(endpoints.clients.list()),

  getPublicClients: async () => httpClient.get(endpoints.clients.listPublic(), { includeAuth: false }),

  getProjectOverview: async (slug: string) => httpClient.get(endpoints.clients.projectOverview(slug)),

  runOperatorTool: async (tool: string) =>
    httpClient.post(endpoints.tools.run(tool), undefined),
};
