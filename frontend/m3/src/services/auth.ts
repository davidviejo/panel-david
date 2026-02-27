import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export interface UserRole {
  role: 'clients_area' | 'operator' | 'project';
  scope?: string;
  token: string;
}

export const authService = {
  loginClientsArea: async (password: string): Promise<UserRole> => {
    const response = await api.post('/api/auth/clients-area', { password });
    const data = response.data;
    const userRole: UserRole = { role: 'clients_area', token: data.token };
    sessionStorage.setItem('authToken', data.token);
    sessionStorage.setItem('userRole', JSON.stringify(userRole));
    return userRole;
  },

  loginOperator: async (password: string): Promise<UserRole> => {
    const response = await api.post('/api/auth/operator', { password });
    const data = response.data;
    const userRole: UserRole = { role: 'operator', token: data.token };
    sessionStorage.setItem('authToken', data.token);
    sessionStorage.setItem('userRole', JSON.stringify(userRole));
    return userRole;
  },

  loginProject: async (slug: string, password: string): Promise<UserRole> => {
    const response = await api.post(`/api/auth/project/${slug}`, { password });
    const data = response.data;
    const userRole: UserRole = { role: 'project', scope: slug, token: data.token };
    sessionStorage.setItem('authToken', data.token);
    sessionStorage.setItem('userRole', JSON.stringify(userRole));
    return userRole;
  },

  logout: () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userRole');
  },

  getCurrentUser: (): UserRole | null => {
    const userRoleStr = sessionStorage.getItem('userRole');
    if (userRoleStr) {
      return JSON.parse(userRoleStr);
    }
    return null;
  },

  isAuthenticated: (): boolean => {
      return !!sessionStorage.getItem('authToken');
  }
};

export const portalService = {
    getClients: async () => {
        const response = await api.get('/api/clients');
        return response.data;
    },

    getProjectOverview: async (slug: string) => {
        const response = await api.get(`/api/${slug}/overview`);
        return response.data;
    },

    runTool: async (tool: string) => {
        const response = await api.post(`/api/tools/run/${tool}`);
        return response.data;
    }
}

export default api;
