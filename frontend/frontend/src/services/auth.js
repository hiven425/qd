import api from '../lib/api'

export const authService = {
  login: async (token) => {
    const response = await api.get('/sites', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}
