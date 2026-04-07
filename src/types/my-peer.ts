export interface MyPeer {
  row_id: number
  id: string
  cpu: string
  hostname: string
  memory: string
  os: string
  username: string
  uuid: string
  version: string
  user_id: number
  last_online_time: number
  last_online_ip: string
  group_id: number
  alias: string
  note: string
  created_at: string
  updated_at: string
}

export interface MyPeerQuery {
  page?: number
  page_size?: number
  id?: string
  hostname?: string
  time_ago?: number
}
