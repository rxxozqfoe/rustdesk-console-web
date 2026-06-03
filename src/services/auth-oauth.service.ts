import { apiGet, apiPost } from '@/lib/api'
import type { LoginResponse } from '@/types/user'

/**
 * Response of `POST /api/admin/oidc/auth`.
 * `code` is the OIDC state used to poll the auth-query endpoint, `url` is the
 * provider authorization URL the user must open.
 */
export interface BeginOAuthResponse {
  code: string
  url: string
}

/**
 * Device info sent when initiating a web-admin OAuth login.
 * The backend hard-codes the device type to "webadmin" server-side; we still
 * send a sensible payload so the login log records a meaningful platform.
 */
const WEB_ADMIN_DEVICE_INFO = {
  name: 'web',
  os: 'web',
  type: 'webadmin',
} as const

function randomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Initiate an OAuth/OIDC login for the given provider `op`.
 * Returns the provider authorization URL plus the `code` (state) to poll with.
 */
export async function beginOAuth(op: string): Promise<BeginOAuthResponse> {
  return apiPost<BeginOAuthResponse>('/api/admin/oidc/auth', {
    op,
    deviceInfo: WEB_ADMIN_DEVICE_INFO,
    id: '',
    uuid: randomUuid(),
  })
}

/**
 * Poll the OAuth auth-query endpoint with the `code` returned by `beginOAuth`.
 *
 * Resolves with the admin login payload once the user has completed the flow.
 * While the flow is pending (or the OAuth account is not yet bound to an admin
 * user) the backend responds with a non-zero envelope code, so the underlying
 * request rejects — callers treat a rejection as "keep polling / surface bind".
 */
export async function pollOAuthQuery(code: string): Promise<LoginResponse> {
  return apiGet<LoginResponse>('/api/admin/oidc/auth-query', {
    code,
    id: '',
    uuid: '',
  })
}
