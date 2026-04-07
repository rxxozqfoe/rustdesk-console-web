export interface UserToken {
  id: number
  user_id: number
  device_uuid: string
  device_id: string
  token: string
  expired_at: number
  created_at: string
  updated_at: string
}

export interface UserTokenQuery {
  page?: number
  page_size?: number
  user_id?: number
}
