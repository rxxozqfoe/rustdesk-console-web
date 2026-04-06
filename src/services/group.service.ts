import { apiGet } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { Group } from '@/types/group'

export function getGroups(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<Group>>('/api/admin/group/list', {
    page: 1,
    page_size: 1000,
    ...params,
  })
}
