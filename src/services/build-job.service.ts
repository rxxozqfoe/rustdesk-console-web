import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { BuildJob, BuildJobTriggerForm } from '@/types/build-job'

export function getBuildVersions() {
  return apiGet<string[]>('/api/admin/build-job/versions')
}

export function triggerBuild(data: BuildJobTriggerForm) {
  return apiPost<BuildJob>('/api/admin/build-job/trigger', data)
}

export function getBuildJobs(params?: { page?: number; page_size?: number; status?: string }) {
  return apiGet<PaginatedData<BuildJob>>(
    '/api/admin/build-job/list',
    params as Record<string, unknown>,
  )
}

export function getBuildJobDetail(id: number) {
  return apiGet<BuildJob>(`/api/admin/build-job/detail/${id}`)
}

export function getBuildJobLog(id: number, offset?: number) {
  return apiGet<{ log: string; offset: number }>(`/api/admin/build-job/log/${id}`, { offset })
}

export function cancelBuildJob(id: number) {
  return apiPost(`/api/admin/build-job/cancel/${id}`)
}

export function deleteBuildJob(id: number) {
  return apiPost('/api/admin/build-job/delete', { id })
}
