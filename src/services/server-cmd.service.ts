import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { ServerCmd, ServerCmdForm } from '@/types/server-cmd'

export function getServerCmds(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<ServerCmd>>('/api/admin/rustdesk/cmdList', {
    page: 1,
    page_size: 1000,
    ...params,
  } as Record<string, unknown>)
}

export function createServerCmd(data: ServerCmdForm) {
  return apiPost('/api/admin/rustdesk/cmdCreate', data)
}

export function deleteServerCmd(id: number) {
  return apiPost('/api/admin/rustdesk/cmdDelete', { id })
}

export function sendCmd(data: { cmd: string; target: string }) {
  return apiPost<string>('/api/admin/rustdesk/sendCmd', data)
}
