import { type ChangeEvent, type FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'

type AccessScreenProps = {
  onSubmitMobile: (raw: string) => void | Promise<void>
  busy?: boolean
  errorMessage?: string | null
}

export function AccessScreen({
  onSubmitMobile,
  busy = false,
  errorMessage,
}: AccessScreenProps) {
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)

  const showError = touched && value.trim() === ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (value.trim() === '') return
    await onSubmitMobile(value)
  }

  return (
    <div className="flex min-h-[78vh] flex-col justify-center sm:min-h-[70vh]">
      <div className="mb-8 text-center sm:mb-10">
        <div
          className={cn(
            'mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl',
            'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
          )}
        >
          <ShieldCheck className="size-9" strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          CNG unload
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-pretty text-sm text-muted-foreground sm:text-base">
          Sign in with your registered mobile to record a vehicle unload.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-border/80 bg-card/90 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:ring-white/10 sm:p-8"
      >
        <Label
          htmlFor="mobile"
          className="text-sm font-medium text-foreground"
        >
          Mobile number
        </Label>
        <Input
          id="mobile"
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="e.g. 9876543210"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setValue(e.target.value)
          }
          disabled={busy}
          aria-invalid={showError}
          className={cn(
            'mt-2 h-14 rounded-2xl border-2 border-border/80 bg-muted/30 px-4 text-lg tracking-wide',
            'placeholder:text-muted-foreground/70',
            showError && 'border-destructive'
          )}
        />
        {errorMessage ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {showError ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            Enter your mobile number to continue.
          </p>
        ) : !errorMessage ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Use a mobile number your manager has authorized.
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={busy}
          className="mt-8 h-14 w-full rounded-2xl text-base font-semibold shadow-md shadow-primary/20"
        >
          {busy ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Checking…
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="size-5 opacity-90" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
