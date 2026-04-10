export interface CustomClient {
  id: number
  name: string
  app_name: string
  server_host: string
  server_key: string
  api_server: string
  relay_server: string
  default_settings: Record<string, string>
  override_settings: Record<string, string>
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface CustomClientForm {
  id?: number
  name: string
  app_name: string
  server_host?: string
  server_key?: string
  api_server?: string
  relay_server?: string
  default_settings?: Record<string, string>
  override_settings?: Record<string, string>
  enabled?: boolean
}

export interface CustomClientQuery {
  page?: number
  page_size?: number
}

export interface BuildArtifact {
  id: number
  platform: string
  arch: string
  format: string
  version: string
  file_path: string
  file_size: number
  sha256: string
  source: string
  created_at: string
  updated_at: string
}
