import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { PreBuild, PreBuildTriggerForm } from '@/types/pre-build'

export function getPreBuildVersions() {
  return apiGet<string[]>('/api/admin/pre-build/versions')
}

export function triggerPreBuild(data: PreBuildTriggerForm) {
  return apiPost<PreBuild>('/api/admin/pre-build/trigger', data)
}

export function getPreBuilds(params?: { page?: number; page_size?: number; status?: string }) {
  return apiGet<PaginatedData<PreBuild>>(
    '/api/admin/pre-build/list',
    params as Record<string, unknown>,
  )
}

export function getPreBuildDetail(id: number) {
  return apiGet<PreBuild>(`/api/admin/pre-build/detail/${id}`)
}

export function getPreBuildLog(id: number, offset?: number) {
  return apiGet<{ log: string; offset: number }>(`/api/admin/pre-build/log/${id}`, { offset })
}

export function cancelPreBuild(id: number) {
  return apiPost(`/api/admin/pre-build/cancel/${id}`)
}

export function deletePreBuild(id: number) {
  return apiPost('/api/admin/pre-build/delete', { id })
}
