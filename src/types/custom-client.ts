export interface CustomClient {
  id: number
  name: string
  server_host: string
  server_key: string
  api_server: string
  relay_server: string
  default_settings: Record<string, string>
  override_settings: Record<string, string>
  platform: string
  arch: string
  version: string
  format: string
  status: 'bundling' | 'completed' | 'failed'
  file_path: string
  file_size: number
  error: string
  created_at: string
  updated_at: string
}

export interface CustomClientForm {
  name: string
  server_host?: string
  server_key?: string
  api_server?: string
  relay_server?: string
  default_settings?: Record<string, string>
  override_settings?: Record<string, string>
  platform: string
  arch: string
  version: string
  format: string
}

export interface CustomClientQuery {
  page?: number
  page_size?: number
}

export interface BuildArtifact {
  id: number
  platform: string
  arch: string
  version: string
  dir_path: string
  source: string
  created_at: string
  updated_at: string
}
