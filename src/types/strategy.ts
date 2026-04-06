export interface Strategy {
  id: number
  guid: string
  name: string
  enabled: boolean
  config_options: Record<string, string>
  extra: Record<string, string>
  created_at: string
  updated_at: string
}

export interface StrategyForm {
  id?: number
  name: string
  enabled?: boolean
  config_options?: Record<string, string>
  extra?: Record<string, string>
}
