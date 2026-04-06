import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {} from '@redux-devtools/extension'
import type { LoginResponse } from '@/types/user'

export interface AuthUser {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string
  is_admin: boolean
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAdmin: boolean
  setAuth: (user: AuthUser, token: string) => void
  setAuthFromLogin: (res: LoginResponse) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAdmin: false,
        setAuth: (user, token) => set({ user, token, isAdmin: user.is_admin }, false, 'setAuth'),
        setAuthFromLogin: (res) => {
          const user: AuthUser = {
            id: 0,
            username: res.username,
            email: res.email,
            nickname: res.nickname,
            avatar: res.avatar,
            is_admin: true,
          }
          set({ user, token: res.token, isAdmin: true }, false, 'setAuthFromLogin')
        },
        clearAuth: () => set({ user: null, token: null, isAdmin: false }, false, 'clearAuth'),
      }),
      { name: 'auth-storage' },
    ),
  ),
)
