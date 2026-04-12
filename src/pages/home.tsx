import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { AccessScreen } from '@/components/access-screen'
import { CngUnloadForm } from '@/components/cng-unload-form'
import { Button } from '@/components/ui/button'
import { useAppSettings } from '@/context/app-settings-context'
import { checkMobileAccess } from '@/lib/api'
import { normalizeIndianMobile } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { AlertCircle, Loader2, Settings } from 'lucide-react'

type Phase = 'gate' | 'denied' | 'form'

export function HomePage() {
  const { settings, loading, error, refresh } = useAppSettings()

  useEffect(() => {
    void refresh()
  }, [refresh])
  const [phase, setPhase] = useState<Phase>('gate')
  const [sessionMobile, setSessionMobile] = useState<string | null>(null)
  const [gateError, setGateError] = useState<string | null>(null)
  const [gateBusy, setGateBusy] = useState(false)

  async function handleSubmitMobile(raw: string) {
    setGateError(null)
    setGateBusy(true)
    try {
      const allowed = await checkMobileAccess(raw)
      if (allowed) {
        setSessionMobile(normalizeIndianMobile(raw))
        setPhase('form')
        return
      }
      setPhase('denied')
    } catch (e) {
      setGateError(
        e instanceof Error ? e.message : 'Could not reach the server.'
      )
    } finally {
      setGateBusy(false)
    }
  }

  function handleSignOut() {
    setSessionMobile(null)
    setPhase('gate')
  }

  return (
    <div
      className={cn(
        'min-h-dvh bg-background',
        'bg-[radial-gradient(1200px_circle_at_50%_-20%,oklch(0.72_0.14_195_/_0.18),transparent),radial-gradient(900px_circle_at_100%_50%,oklch(0.65_0.08_260_/_0.08),transparent)]'
      )}
    >
      <div
        className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:pb-14 sm:pt-10"
        style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
      >
        {loading ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
            <p className="text-sm">Loading configuration…</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-2 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" onClick={() => void refresh()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!loading && !error && settings ? (
          <>
            {phase === 'gate' ? (
              <AccessScreen
                onSubmitMobile={handleSubmitMobile}
                busy={gateBusy}
                errorMessage={gateError}
              />
            ) : null}

            {phase === 'denied' ? (
              <div className="flex min-h-[70vh] flex-col justify-center">
                <div className="rounded-3xl border border-border/80 bg-card/95 p-8 shadow-lg ring-1 ring-black/5 backdrop-blur-sm dark:ring-white/10">
                  <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <AlertCircle className="size-7" aria-hidden />
                  </div>
                  <h1 className="text-center text-xl font-semibold tracking-tight">
                    Access denied
                  </h1>
                  <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
                    This number is not registered for CNG unload entry. Ask your
                    manager to add your mobile in admin settings.
                  </p>
                  <Button
                    type="button"
                    className="mt-8 h-12 w-full rounded-xl text-base"
                    onClick={() => setPhase('gate')}
                  >
                    Try a different number
                  </Button>
                </div>
              </div>
            ) : null}

            {phase === 'form' && sessionMobile ? (
              <CngUnloadForm
                submittedByMobile={sessionMobile}
                onSignOut={handleSignOut}
                retailOutlets={settings.retailOutlets}
                vehicleNumbers={settings.vehicleNumbers}
                routeOptions={settings.routeOptions}
              />
            ) : null}

            {phase === 'gate' ? (
              <p className="mt-8 text-center">
                <Link
                  to="/settings"
                  className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  <Settings className="size-4" aria-hidden />
                  Admin settings
                </Link>
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
