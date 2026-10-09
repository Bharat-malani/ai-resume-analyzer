import axios from 'axios';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('resumeai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or invalid
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        localStorage.removeItem('resumeai_token');
        localStorage.removeItem('resumeai_user');
        window.location.href = '/login?expired=1';
      }
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const resumeApi = {
  upload: (formData) => api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/resumes'),
  getById: (id) => api.get(`/resumes/${id}`),
  delete: (id) => api.delete(`/resumes/${id}`)
};

export const analysisApi = {
  analyze: (resumeId, weights) => api.post(`/analysis/resume/${resumeId}`, { weights }),
  getById: (id) => api.get(`/analysis/${id}`),
  improveBullet: (bullet_point) => api.post('/analysis/improve-bullet', { bullet_point }),
  generateSummary: (resumeId, target_role) => api.post('/analysis/generate-summary', { resumeId, target_role }),
  getHistory: () => api.get('/analysis/user/history'),
  compare: (resumeId1, resumeId2) => api.post('/analysis/compare', { resumeId1, resumeId2 })
};

export const jobApi = {
  create: (data) => api.post('/jobs', data),
  getAll: () => api.get('/jobs'),
  getById: (id) => api.get(`/jobs/${id}`),
  match: (data) => api.post('/jobs/match', data),
  getMatchById: (id) => api.get(`/jobs/match/${id}`)
};

export const adminApi = {
  getStats: () => api.get('/admin/statistics'),
  getUsers: () => api.get('/admin/users'),
  getSkills: () => api.get('/admin/skills'),
  createSkill: (data) => api.post('/admin/skills', data),
  updateSkill: (id, data) => api.put(`/admin/skills/${id}`, data),
  deleteSkill: (id) => api.delete(`/admin/skills/${id}`)
};

export const reportApi = {
  downloadPdf: (analysisId) => {
    const token = localStorage.getItem('resumeai_token');
    return `${API_BASE}/reports/pdf/${analysisId}?token=${encodeURIComponent(token || '')}`;
  },
  downloadPdfBlob: async (analysisId) => {
    const token = localStorage.getItem('resumeai_token');
    const response = await axios.get(`${API_BASE}/reports/pdf/${analysisId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined
      },
      responseType: 'blob'
    });
    return response.data;
  }
};

export default api;
