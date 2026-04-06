import { apiGet, apiPost } from '@/lib/api'
import type { LoginPayload, LoginResponse, LoginOptions } from '@/types/user'

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/admin/login', {
    ...payload,
    platform: 'web',
  })
}

export async function logout(): Promise<void> {
  return apiPost('/api/admin/logout')
}

export async function getLoginOptions(): Promise<LoginOptions> {
  return apiGet<LoginOptions>('/api/admin/login-options')
}

export async function getCaptcha(): Promise<{ id: string; b64: string }> {
  return apiGet('/api/admin/captcha')
}

export async function getCurrentUser() {
  return apiGet('/api/admin/user/current')
}
