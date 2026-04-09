import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { OAuth, OAuthForm } from '@/types/oauth'

export function getOAuthProviders(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<OAuth>>('/api/admin/oauth/list', {
    page: 1,
    page_size: 100,
    ...params,
  } as Record<string, unknown>)
}

export function getOAuthProvider(id: number) {
  return apiGet<OAuth>(`/api/admin/oauth/detail/${id}`)
}

export function createOAuthProvider(data: OAuthForm) {
  return apiPost('/api/admin/oauth/create', data)
}

export function updateOAuthProvider(data: OAuthForm) {
  return apiPost('/api/admin/oauth/update', data)
}

export function deleteOAuthProvider(id: number) {
  return apiPost('/api/admin/oauth/delete', { id })
}
