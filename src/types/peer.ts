export interface Peer {
  row_id: number
  id: string
  cpu: string
  hostname: string
  memory: string
  os: string
  username: string
  uuid: string
  version: string
  alias: string
  device_group_id: number
  note: string
  user_id: number
  last_online_time: string
  last_online_ip: string
  created_at: string
  updated_at: string
  user?: { username: string }
}

export interface PeerForm {
  row_id?: number
  id: string
  cpu?: string
  hostname?: string
  memory?: string
  os?: string
  username?: string
  uuid?: string
  version?: string
  alias?: string
  device_group_id?: number
  note?: string
}

export interface PeerQuery {
  page?: number
  page_size?: number
  id?: string
  hostname?: string
  username?: string
  alias?: string
  ip?: string
  time_ago?: string
}
