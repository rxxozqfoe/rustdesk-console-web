export interface ShareRecord {
  id: number
  user_id: number
  peer_id: string
  share_token: string
  password_type: string
  password: string
  expire: number
  created_at: string
  updated_at: string
}

export interface ShareRecordQuery {
  page?: number
  page_size?: number
  user_id?: number
}
