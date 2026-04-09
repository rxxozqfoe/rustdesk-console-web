import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { LoginLog, LoginLogQuery } from '@/types/login-log'

export function getLoginLogs(params: LoginLogQuery) {
  return apiGet<PaginatedData<LoginLog>>(
    '/api/admin/login_log/list',
    params as Record<string, unknown>,
  )
}

export function deleteLoginLog(id: number) {
  return apiPost('/api/admin/login_log/delete', { id })
}

export function batchDeleteLoginLogs(ids: number[]) {
  return apiPost('/api/admin/login_log/batchDelete', { ids })
}
