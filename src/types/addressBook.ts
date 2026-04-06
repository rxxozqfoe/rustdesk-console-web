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
  force_always_relay: boolean
  rdp_port: string
  rdp_username: string
  online: boolean
  note: string
  user_id: number
  collection_id: number
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
  hash?: string
  force_always_relay?: boolean
  rdp_port?: string
  rdp_username?: string
  note?: string
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
  user_id?: number
  name: string
}

export interface AddressBookCollectionRule {
  id: number
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
