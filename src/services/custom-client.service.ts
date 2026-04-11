import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type {
  CustomClient,
  CustomClientForm,
  CustomClientQuery,
  BuildArtifact,
} from '@/types/custom-client'

// ─── Custom Client CRUD ────────────────────────────────────────────────────

export function getCustomClients(params?: CustomClientQuery) {
  return apiGet<PaginatedData<CustomClient>>(
    '/api/admin/custom-client/list',
    params as Record<string, unknown>,
  )
}

export function getCustomClient(id: number) {
  return apiGet<CustomClient>(`/api/admin/custom-client/detail/${id}`)
}

export function createCustomClient(data: CustomClientForm) {
  return apiPost<CustomClient>('/api/admin/custom-client/create', data)
}

export function deleteCustomClient(id: number) {
  return apiPost('/api/admin/custom-client/delete', { id })
}

export function previewCustomTxt(id: number) {
  return apiGet<{ custom_txt: string }>(`/api/admin/custom-client/preview/${id}`)
}

// ─── Build Artifact ────────────────────────────────────────────────────────

export function getBuildArtifacts(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<BuildArtifact>>(
    '/api/admin/build-artifact/list',
    params as Record<string, unknown>,
  )
}

// ─── Download ──────────────────────────────────────────────────────────────

export function getDownloadUrl(id: number) {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  // Need to include auth token for the download
  const raw = localStorage.getItem('auth-storage')
  let token = ''
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      token = state?.token || ''
    } catch { /* ignore */ }
  }
  return `${base}/api/admin/custom-client/download/${id}${token ? `?api-token=${token}` : ''}`
}
