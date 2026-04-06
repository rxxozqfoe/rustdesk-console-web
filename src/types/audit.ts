export interface AuditConn {
  id: number
  action: string
  conn_id: number
  peer_id: string
  from_peer: string
  from_name: string
  ip: string
  session_id: string
  type: number
  close_time: string
  created_at: string
}

export interface AuditFile {
  id: number
  from_peer: string
  from_name: string
  peer_id: string
  path: string
  is_file: boolean
  type: number
  info: string
  ip: string
  num: number
  created_at: string
}

export interface AuditQuery {
  page?: number
  page_size?: number
  peer_id?: string
  from_peer?: string
}
