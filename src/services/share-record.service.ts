import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { ShareRecord, ShareRecordQuery } from '@/types/share-record'

export function getShareRecords(params: ShareRecordQuery) {
  return apiGet<PaginatedData<ShareRecord>>('/api/admin/share_record/list', params as Record<string, unknown>)
}

export function deleteShareRecord(id: number) {
  return apiPost('/api/admin/share_record/delete', { id })
}

export function batchDeleteShareRecords(ids: number[]) {
  return apiPost('/api/admin/share_record/batchDelete', { ids })
}
