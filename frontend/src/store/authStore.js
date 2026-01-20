import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
    persist(
        (set) => ({
            token: 'change-me', // Default, user can change in settings
            setToken: (token) => set({ token }),
        }),
        {
            name: 'checkinhub-auth',
        }
    )
)
