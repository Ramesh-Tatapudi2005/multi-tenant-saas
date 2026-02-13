import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  registerTenant: (data) => api.post('/auth/register-tenant', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const tenantAPI = {
  getDetails: (tenantId) => api.get(`/tenants/${tenantId}`),
  updateDetails: (tenantId, data) => api.put(`/tenants/${tenantId}`, data),
  listAll: (params) => api.get('/tenants', { params }),
  addUser: (tenantId, data) => api.post(`/tenants/${tenantId}/users`, data),
  listUsers: (tenantId, params) => api.get(`/tenants/${tenantId}/users`, { params })
};

export const userAPI = {
  updateUser: (userId, data) => api.put(`/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/users/${userId}`)
};

export const projectAPI = {
  create: (data) => api.post('/projects', data),
  list: (params) => api.get('/projects', { params }),
  update: (projectId, data) => api.put(`/projects/${projectId}`, data),
  delete: (projectId) => api.delete(`/projects/${projectId}`)
};

export const taskAPI = {
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  list: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  updateStatus: (taskId, data) => api.patch(`/tasks/${taskId}/status`, data),
  update: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  delete: (taskId) => api.delete(`/tasks/${taskId}`)
};

export const healthAPI = {
  check: () => api.get('/health')
};

export default api;
