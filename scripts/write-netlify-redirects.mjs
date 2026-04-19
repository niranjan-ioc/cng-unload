/**
 * After `vite build`, writes `dist/_redirects` so Netlify can:
 * 1. Proxy /api/* → your Express server (avoids SPA serving HTML for /api).
 * 2. SPA fallback for React Router.
 *
 * Set VITE_API_URL or API_URL at build time (e.g. Netlify env) to your API origin,
 * no trailing slash, e.g. https://cng-api.onrender.com
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')

const raw = (process.env.VITE_API_URL ?? process.env.API_URL ?? '').trim()
const target = raw.replace(/\/$/, '')

const lines = []

if (target) {
  lines.push(`/api/*\t${target}/api/:splat\t200`)
} else {
  console.warn(
    '[write-netlify-redirects] VITE_API_URL (or API_URL) not set — /api will NOT be proxied. Set it in Netlify → Environment variables (Build) and redeploy.'
  )
}

lines.push('/*\t/index.html\t200')

const out = `${lines.join('\n')}\n`
const dest = path.join(dist, '_redirects')

if (!fs.existsSync(dist)) {
  console.error('[write-netlify-redirects] dist/ missing — run vite build first.')
  process.exit(1)
}

fs.writeFileSync(dest, out)
console.log(
  `[write-netlify-redirects] wrote ${path.relative(root, dest)}` +
    (target ? ` (proxy /api → ${target})` : ' (SPA only)')
)
