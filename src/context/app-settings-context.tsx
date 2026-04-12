import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

import { fetchPublicSettings } from '@/lib/api'
import type { PublicAppSettings } from '@/types/app-settings'

type AppSettingsContextValue = {
  settings: PublicAppSettings | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null)

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [settings, setSettings] = useState<PublicAppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const s = await fetchPublicSettings()
      setSettings(s)
    } catch (e) {
      setSettings(null)
      setError(e instanceof Error ? e.message : 'Could not load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({ settings, loading, error, refresh }),
    [settings, loading, error, refresh]
  )

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings(): AppSettingsContextValue {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) {
    throw new Error('useAppSettings must be used within AppSettingsProvider')
  }
  return ctx
}
