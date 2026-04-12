/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute API origin in production (omit in dev; Vite proxies `/api`). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
