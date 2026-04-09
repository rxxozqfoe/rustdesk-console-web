import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { MyShareRecord } from '@/types/my-share-record'

export function getMyShareRecords(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<MyShareRecord>>(
    '/api/admin/my/share_record/list',
    params as Record<string, unknown>,
  )
}

export function deleteMyShareRecord(id: number) {
  return apiPost('/api/admin/my/share_record/delete', { id })
}

export function batchDeleteMyShareRecords(ids: number[]) {
  return apiPost('/api/admin/my/share_record/batchDelete', { ids })
}
