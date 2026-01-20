import { create } from 'zustand'

export const useAuth = create((set) => ({
  token: localStorage.getItem('checkinhub_token'),
  isAuthenticated: !!localStorage.getItem('checkinhub_token'),
  login: (token) => {
    localStorage.setItem('checkinhub_token', token)
    set({ token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('checkinhub_token')
    set({ token: null, isAuthenticated: false })
  }
}))
