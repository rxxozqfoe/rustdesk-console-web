export interface WorkerPlatform {
  platform: string
  arch: string
}

export interface Worker {
  id: number
  name: string
  platforms: WorkerPlatform[]
  status: 'online' | 'offline'
  versions: string[]
  last_seen_at: string | null
  created_at: string
  updated_at: string
}
