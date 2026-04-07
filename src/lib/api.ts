import axios from 'axios'

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
      // Only clear auth and redirect for authentication failures (token missing/invalid).
      // Permission errors (e.g. non-admin) should surface as regular errors.
      const isAuthFailure = !message || message === 'NeedLogin' || message.includes('NeedLogin')
      if (isAuthFailure) {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
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
