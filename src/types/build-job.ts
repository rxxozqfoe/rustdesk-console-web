export interface BuildJob {
  id: number
  version: string
  platform: string
  arch: string
  format: string
  status: 'pending' | 'building' | 'completed' | 'failed'
  log_path: string
  error: string
  artifact_id: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface BuildJobTriggerForm {
  version: string
  platform: string
  arch: string
  format: string
}
