import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (raw) {
      const { state } = JSON.parse(raw)
      if (state?.token) {
        config.headers['api-token'] = state.token
      }
    }
  } catch {
    // ignore parse errors
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data
    if (code === 0) {
      return data
    }
    if (code === 403) {
      toast.error(message || 'Please login first')
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(new Error(message || 'Unauthorized'))
    }
    return Promise.reject(new Error(message || 'Request failed'))
  },
  (error) => {
    return Promise.reject(error)
  },
)

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return api.get(url, { params }) as Promise<T>
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  return api.post(url, data) as Promise<T>
}

export default api
