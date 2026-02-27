interface AuthResponse {
  token: string;
  role: string;
  scope?: string;
  error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = {
  // Helper to get headers with token
  getHeaders: () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = sessionStorage.getItem('portal_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Auth Methods
  authClientsArea: async (password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/api/auth/clients-area`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      sessionStorage.setItem('portal_token', data.token);
      sessionStorage.setItem('portal_role', data.role);
    }
    return data;
  },

  authProject: async (slug: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/api/auth/project/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      sessionStorage.setItem('portal_token', data.token);
      sessionStorage.setItem('portal_role', data.role);
      sessionStorage.setItem('portal_scope', data.scope || '');
    }
    return data;
  },

  authOperator: async (password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/api/auth/operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
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

  // Data Methods
  getClients: async () => {
    const res = await fetch(`${API_URL}/api/clients`, {
      headers: api.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },

  getProjectOverview: async (slug: string) => {
    const res = await fetch(`${API_URL}/api/${slug}/overview`, {
      headers: api.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch project overview');
    return res.json();
  },

  runOperatorTool: async (tool: string) => {
     const res = await fetch(`${API_URL}/api/tools/run/${tool}`, {
      method: 'POST',
      headers: api.getHeaders(),
    });
    return res.json();
  }
};
