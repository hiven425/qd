import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api';
const ADMIN_TOKEN = localStorage.getItem('admin_token') || 'change-me';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Sites
  getSites: () => apiClient.get('/sites'),
  createSite: (data) => apiClient.post('/sites', data),
  updateSite: (id, data) => apiClient.put(`/sites/${id}`, data),
  deleteSite: (id) => apiClient.delete(`/sites/${id}`),
  runSite: (id) => apiClient.post(`/sites/${id}/run`),
  pauseSite: (id) => apiClient.post(`/sites/${id}/pause`),
  resumeSite: (id) => apiClient.post(`/sites/${id}/resume`),

  // Runs
  getSiteRuns: (id) => apiClient.get(`/sites/${id}/runs`),
  getRun: (runId) => apiClient.get(`/runs/${runId}`),
};

export default apiClient;
