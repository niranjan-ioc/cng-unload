import { AppSettings } from '../models/AppSettings.js'
import { DEFAULT_APP_SETTINGS, type FullAppSettings } from './defaultSettings.js'

export type PublicAppSettings = Pick<
  FullAppSettings,
  'retailOutlets' | 'vehicleNumbers' | 'routeOptions'
>

export function toPublic(full: FullAppSettings): PublicAppSettings {
  return {
    retailOutlets: full.retailOutlets,
    vehicleNumbers: full.vehicleNumbers,
    routeOptions: full.routeOptions,
  }
}

export async function ensureSettingsSeeded(): Promise<void> {
  const existing = await AppSettings.findById('app').lean()
  if (existing) return
  await AppSettings.create({
    _id: 'app',
    ...DEFAULT_APP_SETTINGS,
  })
}

export async function getFullSettings(): Promise<FullAppSettings> {
  await ensureSettingsSeeded()
  const doc = await AppSettings.findById('app').lean()
  if (!doc) {
    return { ...DEFAULT_APP_SETTINGS }
  }
  return {
    retailOutlets: doc.retailOutlets,
    vehicleNumbers: doc.vehicleNumbers,
    routeOptions: doc.routeOptions,
    authorizedMobileNumbers: doc.authorizedMobileNumbers,
  }
}

export async function getPublicSettings(): Promise<PublicAppSettings> {
  const full = await getFullSettings()
  return toPublic(full)
}

export async function updateFullSettings(
  next: FullAppSettings
): Promise<FullAppSettings> {
  await AppSettings.findByIdAndUpdate(
    'app',
    {
      $set: {
        retailOutlets: next.retailOutlets,
        vehicleNumbers: next.vehicleNumbers,
        routeOptions: next.routeOptions,
        authorizedMobileNumbers: next.authorizedMobileNumbers,
      },
    },
    { upsert: true, new: true, runValidators: true }
  )
  return getFullSettings()
}
