export interface AddressBook {
  row_id: number
  id: string
  username: string
  password: string
  hostname: string
  alias: string
  platform: string
  tags: string[]
  hash: string
  user_id: number
  forceAlwaysRelay: boolean
  rdpPort: string
  rdpUsername: string
  online: boolean
  loginName: string
  same_server: boolean
  note: string
  collection_id: number
  collection?: { id: number; name: string }
  created_at: string
  updated_at: string
}

export interface AddressBookForm {
  row_id?: number
  id: string
  username?: string
  password?: string
  hostname?: string
  alias?: string
  platform?: string
  tags?: string[]
  forceAlwaysRelay?: boolean
  rdpPort?: string
  rdpUsername?: string
  online?: boolean
  loginName?: string
  same_server?: boolean
  note?: string
  collection_id?: number
}

export interface AddressBookQuery {
  page?: number
  page_size?: number
  user_id?: number
  collection_id?: number
  username?: string
  hostname?: string
  id?: string
}

export interface Tag {
  id: number
  name: string
  user_id: number
  color: number
  collection_id: number
  collection?: { id: number; name: string }
  created_at: string
  updated_at: string
}

export interface TagForm {
  id?: number
  name: string
  color: number
  user_id?: number
  collection_id?: number
}

export interface AddressBookCollection {
  id: number
  user_id: number
  name: string
  created_at: string
  updated_at: string
}

export interface AddressBookCollectionForm {
  id?: number
  name: string
  user_id?: number
}

export interface AddressBookCollectionRule {
  id: number
  user_id: number
  collection_id: number
  rule: number
  type: number
  to_id: number
  created_at: string
  updated_at: string
}

export interface AddressBookCollectionRuleForm {
  id?: number
  collection_id: number
  rule: number
  type: number
  to_id: number
}
