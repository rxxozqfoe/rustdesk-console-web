export interface OAuth {
  id: number
  op: string
  oauth_type: string
  client_id: string
  client_secret: string
  issuer: string
  scopes: string
  auto_register: boolean
  pkce_enable: boolean
  pkce_method: string
  redirect_url: string
  created_at: string
  updated_at: string
}

export interface OAuthForm {
  id?: number
  op: string
  oauth_type: string
  client_id: string
  client_secret: string
  issuer?: string
  scopes?: string
  auto_register?: boolean
  pkce_enable?: boolean
  pkce_method?: string
}
