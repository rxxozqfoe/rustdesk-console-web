import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { MyLoginLog } from '@/types/my-login-log'

export function getMyLoginLogs(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<MyLoginLog>>(
    '/api/admin/my/login_log/list',
    params as Record<string, unknown>,
  )
}

export function deleteMyLoginLog(id: number) {
  return apiPost('/api/admin/my/login_log/delete', { id })
}

export function batchDeleteMyLoginLogs(ids: number[]) {
  return apiPost('/api/admin/my/login_log/batchDelete', { ids })
}
