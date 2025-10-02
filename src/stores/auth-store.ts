import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'

export type AuthUser = {
  id: string
  email: string | null
  fullName?: string | null
  avatarUrl?: string | null
}

interface AuthState {
  auth: {
    user: AuthUser | null
    session: Session | null
    accessToken: string | null
    setUser: (user: AuthUser | null) => void
    setSession: (session: Session | null) => void
    setAccessToken: (accessToken: string | null) => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    session: null,
    accessToken: null,
    setUser: (user) =>
      set((state) => ({ ...state, auth: { ...state.auth, user } })),
    setSession: (session) =>
      set((state) => ({ ...state, auth: { ...state.auth, session } })),
    setAccessToken: (accessToken) =>
      set((state) => ({ ...state, auth: { ...state.auth, accessToken } })),
    reset: () =>
      set((state) => ({
        ...state,
        auth: { ...state.auth, user: null, session: null, accessToken: null },
      })),
  },
}))
