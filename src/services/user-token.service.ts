import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { UserToken, UserTokenQuery } from '@/types/user-token'

export function getUserTokens(params: UserTokenQuery) {
  return apiGet<PaginatedData<UserToken>>(
    '/api/admin/user_token/list',
    params as Record<string, unknown>,
  )
}

export function deleteUserToken(id: number) {
  return apiPost('/api/admin/user_token/delete', { id })
}

export function batchDeleteUserTokens(ids: number[]) {
  return apiPost('/api/admin/user_token/batchDelete', { ids })
}
