export interface Tag {
  id: number
  name: string
  color: string
  user_id: number
  collection_id: number
  created_at: string
  updated_at: string
}

export interface TagForm {
  id?: number
  name: string
  color?: string
  user_id?: number
  collection_id?: number
}
