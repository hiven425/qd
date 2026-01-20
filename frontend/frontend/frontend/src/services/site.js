import api from '../lib/api'

export const siteService = {
  list: () => api.get('/sites'),
  get: (id) => api.get(`/sites/${id}`),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`),
  run: (id) => api.post(`/sites/${id}/run`),
  pause: (id) => api.post(`/sites/${id}/pause`),
  resume: (id) => api.post(`/sites/${id}/resume`)
}
