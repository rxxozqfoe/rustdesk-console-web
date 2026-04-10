import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type {
  CustomClient,
  CustomClientForm,
  CustomClientQuery,
  BuildArtifact,
} from '@/types/custom-client'

// ─── Custom Client Config CRUD ─────────────────────────────────────────────

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

export function updateCustomClient(data: CustomClientForm) {
  return apiPost('/api/admin/custom-client/update', data)
}

export function deleteCustomClient(id: number) {
  return apiPost('/api/admin/custom-client/delete', { id })
}

export function previewCustomTxt(id: number) {
  return apiGet<{ custom_txt: string }>(`/api/admin/custom-client/preview/${id}`)
}

// ─── Build Artifact CRUD ───────────────────────────────────────────────────

export function getBuildArtifacts(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<BuildArtifact>>(
    '/api/admin/build-artifact/list',
    params as Record<string, unknown>,
  )
}

export function deleteBuildArtifact(id: number) {
  return apiPost('/api/admin/build-artifact/delete', { id })
}

// Upload is handled via FormData directly in the component

// ─── Download URL helper ───────────────────────────────────────────────────

export function getDownloadUrl(configId: number, platform: string, arch: string, format: string) {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return `${base}/api/admin/custom-client/download/${configId}?platform=${platform}&arch=${arch}&format=${format}`
}
