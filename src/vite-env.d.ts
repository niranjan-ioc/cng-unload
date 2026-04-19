/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional. At **build** time (Netlify / CI), used by `scripts/write-netlify-redirects.mjs`
   * to proxy same-origin `/api/*` to this host. In dev, Vite proxies `/api` and this is unused.
   */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
