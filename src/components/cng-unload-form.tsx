import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { submitUnload } from '@/lib/api'
import type { RetailOutlet } from '@/types/app-settings'
import { cn } from '@/lib/utils'
import {
  cngUnloadDefaultValues,
  cngUnloadFormSchema,
  type CngUnloadFormValues,
} from '@/schemas/cng-unload'
import { CheckCircle2, Loader2, LogOut } from 'lucide-react'

export type { CngUnloadFormValues } from '@/schemas/cng-unload'

type CngUnloadFormProps = {
  submittedByMobile: string
  onSignOut: () => void
  retailOutlets: RetailOutlet[]
  vehicleNumbers: string[]
  routeOptions: string[]
}

function FormSection({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm',
        'ring-1 ring-black/[0.04] backdrop-blur-sm dark:ring-white/[0.06]',
        'sm:p-6'
      )}
    >
      <header className="mb-5 border-b border-border/60 pb-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-primary">
          {kicker}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function FieldBlock({
  label,
  error,
  children,
}: {
  label: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium leading-snug text-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function ChoiceTile({
  selected,
  className,
  ...props
}: React.ComponentProps<'label'> & { selected: boolean }) {
  return (
    <label
      className={cn(
        'flex min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3.5 transition-all',
        'active:scale-[0.99] sm:min-h-0 sm:py-3',
        selected
          ? 'border-primary bg-primary/10 shadow-[inset_0_0_0_1px] shadow-primary/15'
          : 'border-transparent bg-muted/45 hover:bg-muted/70',
        className
      )}
      {...props}
    />
  )
}

const inputClass =
  'h-12 rounded-2xl border-2 border-border/80 bg-muted/35 px-4 text-base md:text-sm'

export function CngUnloadForm({
  submittedByMobile,
  onSignOut,
  retailOutlets,
  vehicleNumbers,
  routeOptions,
}: CngUnloadFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const form = useForm<CngUnloadFormValues>({
    resolver: zodResolver(cngUnloadFormSchema),
    defaultValues: cngUnloadDefaultValues,
    mode: 'onTouched',
  })

  const { control, handleSubmit, reset, formState } = form

  async function onValid(values: CngUnloadFormValues) {
    setSubmitError(null)
    setSuccessId(null)
    try {
      const { id } = await submitUnload({
        ...values,
        submittedByMobile,
      })
      setSuccessId(id)
      reset(cngUnloadDefaultValues)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save')
    }
  }

  return (
    <>
      <header className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            New entry
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Unload record
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Logged in as{' '}
            <span className="font-mono font-medium text-foreground">
              {submittedByMobile}
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0 rounded-2xl"
          onClick={onSignOut}
          aria-label="Sign out"
        >
          <LogOut className="size-5" />
        </Button>
      </header>

      {successId ? (
        <div
          className="mb-6 flex gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground"
          role="status"
        >
          <CheckCircle2
            className="size-5 shrink-0 text-primary"
            aria-hidden
          />
          <div>
            <p className="font-medium">Saved to database</p>
            <p className="mt-0.5 text-muted-foreground">
              Reference ID <span className="font-mono text-foreground">{successId}</span>
            </p>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div
          className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {submitError}
        </div>
      ) : null}

      <form
        id="cng-unload-main"
        className="space-y-5 pb-28 sm:space-y-6 sm:pb-24"
        onSubmit={handleSubmit(onValid)}
        noValidate
      >
        <FormSection kicker="Step 1" title="Outlet">
          <Controller
            name="retailOutletCode"
            control={control}
            render={({ field, fieldState }) => (
              <FieldBlock
                label="Retail outlet"
                error={fieldState.error?.message}
              >
                <RadioGroup
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  className="grid gap-2 sm:gap-2.5"
                  aria-invalid={fieldState.invalid}
                >
                        {retailOutlets.map((o) => {
                    const id = `outlet-${o.code}`
                    const selected = field.value === o.code
                    return (
                      <ChoiceTile key={o.code} htmlFor={id} selected={selected}>
                        <RadioGroupItem
                          id={id}
                          value={o.code}
                          className="shrink-0"
                        />
                        <span className="min-w-0 flex-1 text-sm leading-snug">
                          <span className="font-medium">{o.name}</span>
                          <span className="block text-xs text-muted-foreground sm:inline sm:before:content-['_·_']">
                            {o.code}
                          </span>
                        </span>
                      </ChoiceTile>
                    )
                  })}
                </RadioGroup>
              </FieldBlock>
            )}
          />
        </FormSection>

        <FormSection kicker="Step 2" title="Vehicle & load">
          <Controller
            name="vehicleNo"
            control={control}
            render={({ field, fieldState }) => (
              <FieldBlock
                label="Vehicle number"
                error={fieldState.error?.message}
              >
                <RadioGroup
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5"
                  aria-invalid={fieldState.invalid}
                >
                  {vehicleNumbers.map((v) => {
                    const id = `veh-${v.replace(/\s/g, '-')}`
                    const selected = field.value === v
                    return (
                      <ChoiceTile key={v} htmlFor={id} selected={selected}>
                        <RadioGroupItem id={id} value={v} className="shrink-0" />
                        <span className="font-mono text-sm font-medium tracking-wide">
                          {v}
                        </span>
                      </ChoiceTile>
                    )
                  })}
                </RadioGroup>
              </FieldBlock>
            )}
          />

          <Controller
            name="hpclMograLoadingKg"
            control={control}
            render={({ field, fieldState }) => (
              <FieldBlock
                label="HPCL Mogra loading (kg)"
                error={fieldState.error?.message}
              >
                <Input
                  {...field}
                  inputMode="decimal"
                  placeholder="e.g. 1250"
                  aria-invalid={fieldState.invalid}
                  className={inputClass}
                />
              </FieldBlock>
            )}
          />

          <Controller
            name="vehicleComingFrom"
            control={control}
            render={({ field, fieldState }) => (
              <FieldBlock
                label="Vehicle coming from"
                error={fieldState.error?.message}
              >
                <Select
                  value={field.value || null}
                  onValueChange={(v) => field.onChange(v ?? '')}
                >
                  <SelectTrigger
                    className={cn(inputClass, 'h-12 w-full justify-between')}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {routeOptions.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                  </SelectContent>
                </Select>
              </FieldBlock>
            )}
          />

          <Controller
            name="cascadePressureBefore"
            control={control}
            render={({ field, fieldState }) => (
              <FieldBlock
                label="Cascade pressure before unload"
                error={fieldState.error?.message}
              >
                <Input
                  {...field}
                  inputMode="decimal"
                  placeholder="Pressure reading"
                  aria-invalid={fieldState.invalid}
                  className={inputClass}
                />
              </FieldBlock>
            )}
          />
        </FormSection>

        <FormSection kicker="Step 3" title="Readings & destination">
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="initialReadingKg"
              control={control}
              render={({ field, fieldState }) => (
                <FieldBlock
                  label="Initial reading (kg)"
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    inputMode="decimal"
                    placeholder="0"
                    aria-invalid={fieldState.invalid}
                    className={inputClass}
                  />
                </FieldBlock>
              )}
            />
            <Controller
              name="finalReadingKg"
              control={control}
              render={({ field, fieldState }) => (
                <FieldBlock
                  label="Final reading (kg)"
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    inputMode="decimal"
                    placeholder="0"
                    aria-invalid={fieldState.invalid}
                    className={inputClass}
                  />
                </FieldBlock>
              )}
            />
          </div>

          <Controller
            name="cascadePressureAfter"
            control={control}
            render={({ field, fieldState }) => (
              <FieldBlock
                label="Cascade pressure after unload"
                error={fieldState.error?.message}
              >
                <Input
                  {...field}
                  inputMode="decimal"
                  placeholder="Pressure reading"
                  aria-invalid={fieldState.invalid}
                  className={inputClass}
                />
              </FieldBlock>
            )}
          />

          <Controller
            name="destinationAfter"
            control={control}
            render={({ field, fieldState }) => (
              <FieldBlock
                label="After unload, vehicle going to"
                error={fieldState.error?.message}
              >
                <Select
                  value={field.value || null}
                  onValueChange={(v) => field.onChange(v ?? '')}
                >
                  <SelectTrigger
                    className={cn(inputClass, 'h-12 w-full justify-between')}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {routeOptions.map((r) => (
                      <SelectItem key={`d-${r}`} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldBlock>
            )}
          />
        </FormSection>

        <FormSection kicker="Step 4" title="Operator">
          <Controller
            name="operatorName"
            control={control}
            render={({ field, fieldState }) => (
              <FieldBlock
                label="Operator name"
                error={fieldState.error?.message}
              >
                <Input
                  {...field}
                  autoComplete="name"
                  placeholder="Full name"
                  aria-invalid={fieldState.invalid}
                  className={inputClass}
                />
              </FieldBlock>
            )}
          />
        </FormSection>

        <FormSection kicker="Step 5" title="Vehicle out">
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="dateOfVehicleOut"
              control={control}
              render={({ field, fieldState }) => (
                <FieldBlock
                  label="Date out"
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    type="date"
                    aria-invalid={fieldState.invalid}
                    className={inputClass}
                  />
                </FieldBlock>
              )}
            />
            <Controller
              name="timeOfVehicleOut"
              control={control}
              render={({ field, fieldState }) => (
                <FieldBlock
                  label="Time out"
                  error={fieldState.error?.message}
                >
                  <Input
                    {...field}
                    type="time"
                    aria-invalid={fieldState.invalid}
                    className={inputClass}
                  />
                </FieldBlock>
              )}
            />
          </div>
        </FormSection>
      </form>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 border-t border-border/80',
          'bg-card/90 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg',
          'supports-[backdrop-filter]:bg-card/75'
        )}
      >
        <div className="mx-auto flex w-full max-w-lg gap-3 px-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-2xl text-base"
            disabled={formState.isSubmitting}
            onClick={() => {
              reset(cngUnloadDefaultValues)
              setSubmitError(null)
            }}
          >
            Clear
          </Button>
          <Button
            type="submit"
            form="cng-unload-main"
            className="h-12 flex-[1.35] rounded-2xl text-base font-semibold shadow-md shadow-primary/25"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Saving…
              </>
            ) : (
              'Save record'
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
