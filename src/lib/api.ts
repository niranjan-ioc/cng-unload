import type { CngUnloadFormValues } from '@/schemas/cng-unload'
import type { FullAppSettings, PublicAppSettings } from '@/types/app-settings'

export type UnloadPayload = CngUnloadFormValues & {
  submittedByMobile: string
}

/**
 * Same-origin `/api` — Vite dev server proxies to Express; Netlify uses
 * `dist/_redirects` (written at build from VITE_API_URL) to proxy to your API.
 */
function apiBase(): string {
  return ''
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  const start = text.trimStart()
  if (start.startsWith('<')) {
    throw new Error(
      'Got HTML instead of JSON from /api. On Netlify, set VITE_API_URL (your API origin, no trailing slash) for **builds**, redeploy, and ensure scripts/write-netlify-redirects ran so /api is proxied.'
    )
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Invalid JSON from server')
  }
}

export async function fetchPublicSettings(): Promise<PublicAppSettings> {
  const res = await fetch(`${apiBase()}/api/settings`)
  const data = await parseJson<{ error?: string } & PublicAppSettings>(res)
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Could not load settings'
    )
  }
  return {
    retailOutlets: data.retailOutlets,
    vehicleNumbers: data.vehicleNumbers,
    routeOptions: data.routeOptions,
  }
}

export async function checkMobileAccess(rawMobile: string): Promise<boolean> {
  const res = await fetch(`${apiBase()}/api/access/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawMobile }),
  })
  const data = await parseJson<{ allowed?: boolean; error?: string }>(res)
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Could not verify mobile'
    )
  }
  return data.allowed === true
}

export async function submitUnload(
  payload: UnloadPayload
): Promise<{ id: string }> {
  const res = await fetch(`${apiBase()}/api/unloads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await parseJson<{ id?: string; error?: string }>(res)

  if (!res.ok) {
    const msg =
      typeof data.error === 'string'
        ? data.error
        : `Request failed (${res.status})`
    throw new Error(msg)
  }

  if (typeof data.id !== 'string') {
    throw new Error('Invalid response from server')
  }

  return { id: data.id }
}

const ADMIN_TOKEN_KEY = 'cng_admin_jwt'

export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string | null): void {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function postAdminLogin(
  email: string,
  password: string
): Promise<{ token: string; email: string }> {
  const res = await fetch(`${apiBase()}/api/admin/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await parseJson<{ token?: string; email?: string; error?: string }>(
    res
  )
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Admin sign-in failed'
    )
  }
  if (typeof data.token !== 'string' || typeof data.email !== 'string') {
    throw new Error('Invalid admin session response')
  }
  return { token: data.token, email: data.email }
}

export async function fetchAdminSettings(): Promise<FullAppSettings> {
  const token = getAdminToken()
  if (!token) throw new Error('Not signed in')
  const res = await fetch(`${apiBase()}/api/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await parseJson<{ error?: string } & Partial<FullAppSettings>>(
    res
  )
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Could not load admin data'
    )
  }
  return data as FullAppSettings
}

export async function putAdminSettings(
  body: FullAppSettings
): Promise<FullAppSettings> {
  const token = getAdminToken()
  if (!token) throw new Error('Not signed in')
  const res = await fetch(`${apiBase()}/api/admin/settings`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await parseJson<{ error?: string } & Partial<FullAppSettings>>(
    res
  )
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Could not save settings'
    )
  }
  return data as FullAppSettings
}
