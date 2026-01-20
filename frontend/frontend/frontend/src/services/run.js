import api from '../lib/api'

export const runService = {
  listBySite: (siteId) => api.get(`/sites/${siteId}/runs`),
  get: (runId) => api.get(`/runs/${runId}`)
}
