import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { Peer, PeerForm, PeerQuery } from '@/types/peer'

export function getPeers(params: PeerQuery) {
  return apiGet<PaginatedData<Peer>>('/api/admin/peer/list', params as Record<string, unknown>)
}

export function getPeer(id: number) {
  return apiGet<Peer>(`/api/admin/peer/detail/${id}`)
}

export function createPeer(data: PeerForm) {
  return apiPost('/api/admin/peer/create', data)
}

export function updatePeer(data: PeerForm) {
  return apiPost('/api/admin/peer/update', data)
}

export function deletePeer(rowId: number) {
  return apiPost('/api/admin/peer/delete', { row_id: rowId })
}

export function batchDeletePeers(rowIds: number[]) {
  return apiPost('/api/admin/peer/batchDelete', { row_ids: rowIds })
}
