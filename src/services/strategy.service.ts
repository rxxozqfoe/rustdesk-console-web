import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type {
  Strategy,
  StrategyForm,
  StrategyAssignForm,
  StrategyAssignment,
  StrategyQuery,
} from '@/types/strategy'

export function getStrategies(params?: StrategyQuery) {
  return apiGet<PaginatedData<Strategy>>(
    '/api/admin/strategy/list',
    params as Record<string, unknown>,
  )
}

export function getStrategy(id: number) {
  return apiGet<Strategy>(`/api/admin/strategy/detail/${id}`)
}

export function createStrategy(data: StrategyForm) {
  return apiPost('/api/admin/strategy/create', data)
}

export function updateStrategy(data: StrategyForm) {
  return apiPost('/api/admin/strategy/update', data)
}

export function deleteStrategy(id: number) {
  return apiPost('/api/admin/strategy/delete', { id })
}

export function assignStrategy(data: StrategyAssignForm) {
  return apiPost('/api/admin/strategy/assign', data)
}

export function getStrategyAssignments(id: number) {
  return apiGet<StrategyAssignment[]>(`/api/admin/strategy/assignments/${id}`)
}
