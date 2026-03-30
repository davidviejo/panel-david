import { createHttpClient } from './httpClient';

interface AuthResponse {
  token: string;
  role: string;
  scope?: string;
  error?: string;
}

const httpClient = createHttpClient({ service: 'api' });

export const api = {
  authClientsArea: async (password: string): Promise<AuthResponse> => {
    const data = await httpClient.post<AuthResponse>('api/auth/clients-area', { password }, { includeAuth: false });
    if (data.token) {
      sessionStorage.setItem('portal_token', data.token);
      sessionStorage.setItem('portal_role', data.role);
    }
    return data;
  },

  authProject: async (slug: string, password: string): Promise<AuthResponse> => {
    const data = await httpClient.post<AuthResponse>(`api/auth/project/${slug}`, { password }, { includeAuth: false });
    if (data.token) {
      sessionStorage.setItem('portal_token', data.token);
      sessionStorage.setItem('portal_role', data.role);
      sessionStorage.setItem('portal_scope', data.scope || '');
    }
    return data;
  },

  authOperator: async (password: string): Promise<AuthResponse> => {
    const data = await httpClient.post<AuthResponse>('api/auth/operator', { password }, { includeAuth: false });
    if (data.token) {
      sessionStorage.setItem('portal_token', data.token);
      sessionStorage.setItem('portal_role', data.role);
    }
    return data;
  },

  logout: () => {
    sessionStorage.removeItem('portal_token');
    sessionStorage.removeItem('portal_role');
    sessionStorage.removeItem('portal_scope');
    window.location.href = '/';
  },

  getClients: async () => httpClient.get('api/clients'),

  getPublicClients: async () => httpClient.get('api/public/clients', { includeAuth: false }),

  getProjectOverview: async (slug: string) => httpClient.get(`api/${slug}/overview`),

  runOperatorTool: async (tool: string) =>
    httpClient.post(`api/tools/run/${tool}`, undefined),
};
