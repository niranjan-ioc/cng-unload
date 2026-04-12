import type { CngUnloadFormValues } from '@/schemas/cng-unload'
import type { FullAppSettings, PublicAppSettings } from '@/types/app-settings'

export type UnloadPayload = CngUnloadFormValues & {
  submittedByMobile: string
}

/**
 * In dev, Vite proxies `/api` → local Express. In production (e.g. Netlify), same-origin
 * `/api` is rewritten to `index.html`, so you must set `VITE_API_URL` to your API origin.
 */
function apiBase(): string {
  const raw = import.meta.env.VITE_API_URL
  const trimmed =
    typeof raw === 'string' ? raw.trim().replace(/\/$/, '') : ''

  if (trimmed.length > 0) return trimmed

  if (import.meta.env.DEV) return ''

  throw new Error(
    'Missing VITE_API_URL. Netlify (and other static hosts) do not run your Express API. Add your public API URL under Site configuration → Environment variables → VITE_API_URL (no trailing slash), then trigger a new deploy.'
  )
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  const start = text.trimStart()
  if (start.startsWith('<')) {
    throw new Error(
      'Got an HTML page instead of API data. Usually this means VITE_API_URL is unset and /api was served as the SPA shell. Set VITE_API_URL to your backend and redeploy.'
    )
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Invalid JSON from server')
  }
}

export async function fetchPublicSettings(): Promise<PublicAppSettings> {
  const base = apiBase()
  const res = await fetch(`${base}/api/settings`)
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
  const base = apiBase()
  const res = await fetch(`${base}/api/access/check`, {
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
  const base = apiBase()
  const res = await fetch(`${base}/api/unloads`, {
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
  const base = apiBase()
  const res = await fetch(`${base}/api/admin/session`, {
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
  const base = apiBase()
  const res = await fetch(`${base}/api/admin/settings`, {
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
  const base = apiBase()
  const res = await fetch(`${base}/api/admin/settings`, {
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
