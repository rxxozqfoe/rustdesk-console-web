import { apiGet } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { MyPeer, MyPeerQuery } from '@/types/my-peer'

export function getMyPeers(params: MyPeerQuery) {
  return apiGet<PaginatedData<MyPeer>>('/api/admin/my/peer/list', params as Record<string, unknown>)
}
