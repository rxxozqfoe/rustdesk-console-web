export interface Group {
  id: number
  name: string
  type: number
  created_at: string
  updated_at: string
}

export interface GroupForm {
  id?: number
  name: string
  type?: number
}

export interface DeviceGroup {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface DeviceGroupForm {
  id?: number
  name: string
}
