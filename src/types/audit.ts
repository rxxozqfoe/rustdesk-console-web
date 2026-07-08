export interface AuditConn {
  id: number
  action: string
  conn_id: number
  peer_id: string
  from_peer: string
  from_name: string
  ip: string
  session_id: string
  type: number
  // 1.4.9+: primary authentication method used by the controller.
  // 0=None 1=Click 2=TemporaryPassword 3=PermanentPassword 4=SwitchSides
  primary_auth: number
  // 1.4.9+: two-factor method. 0=None 1=TOTP 2=TrustedDevice
  two_factor: number
  // 1.4.9+: controller user attribution, resolved from conn_audit_ref.
  controller_user_id: number
  controller_username: string
  close_time: string
  created_at: string
}

export interface AuditFile {
  id: number
  from_peer: string
  from_name: string
  peer_id: string
  path: string
  is_file: boolean
  type: number
  info: string
  ip: string
  num: number
  created_at: string
}

export interface AuditQuery {
  page?: number
  page_size?: number
  peer_id?: string
  from_peer?: string
}
