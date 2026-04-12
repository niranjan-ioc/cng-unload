import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  fetchAdminSettings,
  getAdminToken,
  postAdminLogin,
  putAdminSettings,
  setAdminToken,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import type { FullAppSettings, RetailOutlet } from '@/types/app-settings'
import {
  ArrowLeft,
  Loader2,
  Lock,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'

function emptyFull(): FullAppSettings {
  return {
    retailOutlets: [{ name: '', code: '' }],
    vehicleNumbers: [''],
    routeOptions: [''],
    authorizedMobileNumbers: [''],
  }
}

export function SettingsPage() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [adminAuthed, setAdminAuthed] = useState(() => !!getAdminToken())
  const [booting, setBooting] = useState(() => !!getAdminToken())
  const [draft, setDraft] = useState<FullAppSettings>(emptyFull())
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [loginBusy, setLoginBusy] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const load = useCallback(async () => {
    setLoadError(null)
    if (!getAdminToken()) {
      setAdminAuthed(false)
      setBooting(false)
      return
    }
    setAdminAuthed(true)
    setBooting(true)
    try {
      const full = await fetchAdminSettings()
      setDraft(full)
    } catch (e) {
      setAdminToken(null)
      setAdminEmail(null)
      setAdminAuthed(false)
      setLoadError(
        e instanceof Error ? e.message : 'Session expired. Sign in again.'
      )
    } finally {
      setBooting(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginBusy(true)
    try {
      const { token, email } = await postAdminLogin(loginEmail, loginPassword)
      setAdminToken(token)
      setAdminEmail(email)
      setAdminAuthed(true)
      setBooting(true)
      const full = await fetchAdminSettings()
      setDraft(full)
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : 'Login failed'
      )
    } finally {
      setLoginBusy(false)
      setBooting(false)
    }
  }

  function signOutAdmin() {
    setAdminToken(null)
    setAdminEmail(null)
    setAdminAuthed(false)
    setDraft(emptyFull())
    setSaveOk(false)
    setLoginEmail('')
    setLoginPassword('')
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaveOk(false)
    try {
      const saved = await putAdminSettings(draft)
      setDraft(saved)
      setSaveOk(true)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function updateOutlet(i: number, patch: Partial<RetailOutlet>) {
    setDraft((d) => ({
      ...d,
      retailOutlets: d.retailOutlets.map((o, j) =>
        j === i ? { ...o, ...patch } : o
      ),
    }))
  }

  function addOutlet() {
    setDraft((d) => ({
      ...d,
      retailOutlets: [...d.retailOutlets, { name: '', code: '' }],
    }))
  }

  function removeOutlet(i: number) {
    setDraft((d) => ({
      ...d,
      retailOutlets: d.retailOutlets.filter((_, j) => j !== i),
    }))
  }

  function updateStringList(
    key: 'vehicleNumbers' | 'routeOptions' | 'authorizedMobileNumbers',
    i: number,
    value: string
  ) {
    setDraft((d) => ({
      ...d,
      [key]: d[key].map((x, j) => (j === i ? value : x)),
    }))
  }

  function addStringRow(
    key: 'vehicleNumbers' | 'routeOptions' | 'authorizedMobileNumbers'
  ) {
    setDraft((d) => ({ ...d, [key]: [...d[key], ''] }))
  }

  function removeStringRow(
    key: 'vehicleNumbers' | 'routeOptions' | 'authorizedMobileNumbers',
    i: number
  ) {
    setDraft((d) => ({ ...d, [key]: d[key].filter((_, j) => j !== i) }))
  }

  return (
    <div
      className={cn(
        'min-h-dvh bg-background',
        'bg-[radial-gradient(1200px_circle_at_50%_-20%,oklch(0.72_0.14_195_/_0.18),transparent),radial-gradient(900px_circle_at_100%_50%,oklch(0.65_0.08_260_/_0.08),transparent)]'
      )}
    >
      <div className="mx-auto w-full max-w-lg px-4 py-6 pb-28 sm:max-w-2xl sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back to home"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon' }),
              'size-11 shrink-0 rounded-2xl'
            )}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Admin settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Only the admin can edit outlets, vehicles, routes, and mobiles.
            </p>
          </div>
        </div>

        {booting ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-10 animate-spin text-primary" />
          </div>
        ) : null}

        {!booting && !adminAuthed ? (
          <div className="rounded-3xl border border-border/80 bg-card/95 p-8 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="size-7" aria-hidden />
            </div>
            <h2 className="text-center text-lg font-semibold tracking-tight">
              Admin login
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Enter the admin email and password to manage app settings.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <div>
                <Label htmlFor="admin-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="niranjan.19950806@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="mt-1.5 h-12 rounded-2xl"
                  required
                />
              </div>
              <div>
                <Label htmlFor="admin-password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="mt-1.5 h-12 rounded-2xl"
                  required
                />
              </div>

              {loginError ? (
                <p className="text-sm text-destructive" role="alert">
                  {loginError}
                </p>
              ) : null}
              {loadError ? (
                <p className="text-sm text-destructive" role="alert">
                  {loadError}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={loginBusy}
                className="mt-2 h-12 w-full rounded-2xl text-base font-semibold shadow-md shadow-primary/20"
              >
                {loginBusy ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </div>
        ) : null}

        {!booting && adminAuthed ? (
          <>
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/90 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                Signed in as{' '}
                <span className="font-medium text-foreground">
                  {adminEmail ?? 'admin'}
                </span>
              </p>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={signOutAdmin}
              >
                Sign out
              </Button>
            </div>

            {saveOk ? (
              <p
                className="mb-4 text-sm font-medium text-primary"
                role="status"
              >
                Settings saved.
              </p>
            ) : null}
            {saveError ? (
              <p className="mb-4 text-sm text-destructive" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="space-y-6">
              <section className="rounded-3xl border border-border/70 bg-card/90 p-5 sm:p-6">
                <h2 className="text-base font-semibold">Retail outlets</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Name and outlet code shown on the unload form.
                </p>
                <div className="mt-4 space-y-3">
                  {draft.retailOutlets.map((o, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-end"
                    >
                      <div className="grid flex-1 gap-2 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input
                            className="mt-1 h-11 rounded-xl"
                            value={o.name}
                            onChange={(e) =>
                              updateOutlet(i, { name: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Code</Label>
                          <Input
                            className="mt-1 h-11 rounded-xl"
                            value={o.code}
                            onChange={(e) =>
                              updateOutlet(i, { code: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive"
                        aria-label="Remove outlet"
                        onClick={() => removeOutlet(i)}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={addOutlet}
                >
                  <Plus className="size-4" />
                  Add outlet
                </Button>
              </section>

              <section className="rounded-3xl border border-border/70 bg-card/90 p-5 sm:p-6">
                <h2 className="text-base font-semibold">Vehicle numbers</h2>
                <div className="mt-4 space-y-2">
                  {draft.vehicleNumbers.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        className="h-11 flex-1 rounded-xl font-mono text-sm"
                        value={v}
                        onChange={(e) =>
                          updateStringList('vehicleNumbers', i, e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive"
                        aria-label="Remove vehicle"
                        onClick={() => removeStringRow('vehicleNumbers', i)}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => addStringRow('vehicleNumbers')}
                >
                  <Plus className="size-4" />
                  Add vehicle
                </Button>
              </section>

              <section className="rounded-3xl border border-border/70 bg-card/90 p-5 sm:p-6">
                <h2 className="text-base font-semibold">Route options</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Used for "coming from" and "going to".
                </p>
                <div className="mt-4 space-y-2">
                  {draft.routeOptions.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        className="h-11 flex-1 rounded-xl"
                        value={r}
                        onChange={(e) =>
                          updateStringList('routeOptions', i, e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive"
                        aria-label="Remove route"
                        onClick={() => removeStringRow('routeOptions', i)}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => addStringRow('routeOptions')}
                >
                  <Plus className="size-4" />
                  Add route
                </Button>
              </section>

              <section className="rounded-3xl border border-border/70 bg-card/90 p-5 sm:p-6">
                <h2 className="text-base font-semibold">
                  Authorized mobile numbers
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  10-digit numbers; +91 is accepted on save.
                </p>
                <div className="mt-4 space-y-2">
                  {draft.authorizedMobileNumbers.map((m, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        className="h-11 flex-1 rounded-xl font-mono text-sm"
                        inputMode="numeric"
                        value={m}
                        onChange={(e) =>
                          updateStringList(
                            'authorizedMobileNumbers',
                            i,
                            e.target.value
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive"
                        aria-label="Remove mobile"
                        onClick={() =>
                          removeStringRow('authorizedMobileNumbers', i)
                        }
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => addStringRow('authorizedMobileNumbers')}
                >
                  <Plus className="size-4" />
                  Add mobile
                </Button>
              </section>
            </div>

            <div
              className={cn(
                'fixed inset-x-0 bottom-0 z-50 border-t border-border/80',
                'bg-card/90 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg'
              )}
            >
              <div className="mx-auto flex max-w-lg gap-3 px-4 sm:max-w-2xl sm:px-6">
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-2xl text-base font-semibold shadow-md shadow-primary/25"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="size-5" />
                      Save all
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
