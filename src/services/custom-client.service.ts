import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedData } from '@/types/api'
import type { CustomClient, CustomClientForm, BuildArtifact } from '@/types/custom-client'

export function getCustomClients(params?: { page?: number; page_size?: number }) {
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

// ─── Server Config ─────────────────────────────────────────────────────────

export interface ServerConfig {
  id_server: string
  key: string
  relay_server: string
  api_server: string
}

export function getServerConfig() {
  return apiGet<ServerConfig>('/api/admin/config/server')
}

// ─── Build Artifact ────────────────────────────────────────────────────────

export function getBuildArtifacts(params?: { page?: number; page_size?: number }) {
  return apiGet<PaginatedData<BuildArtifact>>(
    '/api/admin/build-artifact/list',
    params as Record<string, unknown>,
  )
}

// ─── Download ──────────────────────────────────────────────────────────────

// Download is a public endpoint (no auth). URL includes filename so wget/curl
// saves with the correct name without needing --content-disposition.
export function getDownloadUrl(cc: {
  id: number
  version: string
  platform: string
  arch: string
  format: string
}) {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  const filename = `rustdesk-${cc.version}-${cc.platform}-${cc.arch}.${cc.format}`
  return `${base}/api/admin/custom-client/download/${cc.id}/${filename}`
}
