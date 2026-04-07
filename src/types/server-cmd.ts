export interface ServerCmd {
  id: number
  cmd: string
  alias: string
  option: string
  explain: string
  target: string
  created_at: string
  updated_at: string
}

export interface ServerCmdForm {
  id?: number
  cmd: string
  alias?: string
  option?: string
  explain?: string
  target: string
}
