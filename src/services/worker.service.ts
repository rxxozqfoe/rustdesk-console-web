import { apiGet } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { Worker } from '@/types/worker'

export function getWorkers(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<Worker>>(
    '/api/admin/worker/list',
    params as Record<string, unknown>,
  )
}
