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

export interface StrategyAssignForm {
  strategy: string // guid, empty string = unassign all
  peers?: string[] // peer device IDs
  users?: number[] // user IDs
  groups?: number[] // device group IDs
}

export interface StrategyAssignment {
  type: 'peer' | 'user' | 'device_group'
  id: string | number
  name: string
}

export interface StrategyQuery {
  page?: number
  page_size?: number
}
