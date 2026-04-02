import { redirectToLoginForExpiredSession } from './authSession';
import { endpoints } from './endpoints';
import { registerAuthErrorHandler, createHttpClient } from './httpClient';

interface AuthResponse {
  authenticated: boolean;
  role: string;
  scope?: string;
  session?: {
    strategy: 'httpOnlyCookie';
    expiresInSeconds: number;
  };
  error?: string;
}

interface SessionResponse {
  authenticated: boolean;
  role: string;
  scope?: string;
}

const httpClient = createHttpClient({ service: 'api' });

registerAuthErrorHandler(() => {
  redirectToLoginForExpiredSession();
});

export const api = {
  authClientsArea: async (password: string): Promise<AuthResponse> =>
    httpClient.post<AuthResponse>(endpoints.auth.clientsArea(), { password }, { includeAuth: false }),

  authProject: async (slug: string, password: string): Promise<AuthResponse> =>
    httpClient.post<AuthResponse>(endpoints.auth.project(slug), { password }, { includeAuth: false }),

  authOperator: async (password: string): Promise<AuthResponse> =>
    httpClient.post<AuthResponse>(endpoints.auth.operator(), { password }, { includeAuth: false }),

  getSession: async (): Promise<SessionResponse> =>
    httpClient.get<SessionResponse>('api/auth/session'),

  logout: async () => {
    try {
      await httpClient.post<{ ok: boolean }>('api/auth/logout', undefined, { includeAuth: false });
    } finally {
      window.sessionStorage.removeItem('portal_auth_message');
      window.location.assign('/');
    }
  },

  getClients: async () => httpClient.get(endpoints.clients.list()),

  getPublicClients: async () => httpClient.get(endpoints.clients.listPublic(), { includeAuth: false }),

  getProjectOverview: async (slug: string) => httpClient.get(endpoints.clients.projectOverview(slug)),

  runOperatorTool: async (tool: string) =>
    httpClient.post(endpoints.tools.run(tool), undefined),
};
