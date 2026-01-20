import client from './client'

export const getSites = () => client.get('/sites')

export const getSite = (id) => client.get(`/sites/${id}`)

export const createSite = (data) => client.post('/sites', data)

export const updateSite = (id, data) => client.put(`/sites/${id}`, data)

export const deleteSite = (id) => client.delete(`/sites/${id}`)

export const runSite = (id) => client.post(`/sites/${id}/run`)

export const pauseSite = (id) => client.post(`/sites/${id}/pause`)

export const resumeSite = (id) => client.post(`/sites/${id}/resume`)
