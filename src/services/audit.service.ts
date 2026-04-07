import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { AuditConn, AuditFile, AuditQuery } from '@/types/audit'

// Connection Logs
export function getAuditConns(params: AuditQuery) {
  return apiGet<PaginatedData<AuditConn>>('/api/admin/audit_conn/list', params as Record<string, unknown>)
}

export function deleteAuditConn(id: number) {
  return apiPost('/api/admin/audit_conn/delete', { id })
}

export function batchDeleteAuditConns(ids: number[]) {
  return apiPost('/api/admin/audit_conn/batchDelete', { ids })
}

// File Transfer Logs
export function getAuditFiles(params: AuditQuery) {
  return apiGet<PaginatedData<AuditFile>>('/api/admin/audit_file/list', params as Record<string, unknown>)
}

export function deleteAuditFile(id: number) {
  return apiPost('/api/admin/audit_file/delete', { id })
}

export function batchDeleteAuditFiles(ids: number[]) {
  return apiPost('/api/admin/audit_file/batchDelete', { ids })
}
