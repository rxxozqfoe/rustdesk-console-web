import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { Group, GroupForm } from '@/types/group'

export function getGroups(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<Group>>('/api/admin/group/list', {
    page: 1,
    page_size: 1000,
    ...params,
  })
}

export function getGroup(id: number) {
  return apiGet<Group>(`/api/admin/group/detail/${id}`)
}

export function createGroup(data: GroupForm) {
  return apiPost('/api/admin/group/create', data)
}

export function updateGroup(data: GroupForm) {
  return apiPost('/api/admin/group/update', data)
}

export function deleteGroup(id: number) {
  return apiPost('/api/admin/group/delete', { id })
}
