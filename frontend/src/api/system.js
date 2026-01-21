import client from './client'

export const getSystemStatus = () => client.get('/system/status')

export const getScheduledJobs = () => client.get('/system/jobs')

export const getRecentRuns = (limit = 10) => client.get(`/system/runs/recent?limit=${limit}`)

export const testWebhook = () => client.post('/system/webhook/test')
