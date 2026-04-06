export interface User {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string
  group_id: number
  is_admin: boolean
  status: number
  remark: string
  created_at: string
  updated_at: string
}

export interface UserForm {
  id?: number
  username: string
  email?: string
  nickname?: string
  group_id?: number
  is_admin?: boolean
  status?: number
  remark?: string
  password?: string
}

export interface LoginPayload {
  username: string
  password: string
  platform?: string
  captcha?: string
  captcha_id?: string
}

export interface LoginResponse {
  token: string
  username: string
  email: string
  avatar: string
  nickname: string
  route_names: string[]
}

export interface LoginOptions {
  need_captcha: boolean
  disable_pwd: boolean
  auto_oidc: boolean
  register: boolean
  ops: OAuthProvider[]
}

export interface OAuthProvider {
  name: string
  type: string
}
