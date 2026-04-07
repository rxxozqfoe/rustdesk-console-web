export interface LoginLog {
  id: number
  user_id: number
  client: string
  device_id: string
  uuid: string
  ip: string
  type: string
  platform: string
  created_at: string
  updated_at: string
}

export interface LoginLogQuery {
  page?: number
  page_size?: number
  user_id?: number
}
