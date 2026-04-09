export interface MyAddressBook {
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

export interface MyAddressBookForm {
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

export interface MyAddressBookQuery {
  page?: number
  page_size?: number
  id?: string
  username?: string
  hostname?: string
  collection_id?: number
}

export interface MyTag {
  id: number
  name: string
  user_id: number
  color: number
  collection_id: number
  collection?: { id: number; name: string }
  created_at: string
  updated_at: string
}

export interface MyTagForm {
  id?: number
  name: string
  color: number
  collection_id?: number
}

export interface MyAddressBookCollection {
  id: number
  user_id: number
  name: string
  created_at: string
  updated_at: string
}

export interface MyAddressBookCollectionForm {
  id?: number
  name: string
}

export interface MyAddressBookCollectionRule {
  id: number
  user_id: number
  collection_id: number
  rule: number // 1=Read, 2=ReadWrite, 3=FullControl
  type: number // 1=User, 2=Group
  to_id: number
  created_at: string
  updated_at: string
}

export interface MyAddressBookCollectionRuleForm {
  id?: number
  collection_id: number
  rule: number
  type: number
  to_id: number
}
