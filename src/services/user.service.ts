import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { User, UserForm } from '@/types/user'

export function getUsers(params: { page?: number; page_size?: number; username?: string }) {
  return apiGet<PaginatedData<User>>('/api/admin/user/list', params)
}

export function getUser(id: number) {
  return apiGet<User>(`/api/admin/user/detail/${id}`)
}

export function createUser(data: UserForm) {
  return apiPost('/api/admin/user/create', data)
}

export function updateUser(data: UserForm) {
  return apiPost('/api/admin/user/update', data)
}

export function deleteUser(id: number) {
  return apiPost('/api/admin/user/delete', { id })
}

export function changePassword(id: number, password: string) {
  return apiPost('/api/admin/user/changePwd', { id, password })
}
