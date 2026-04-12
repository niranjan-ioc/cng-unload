import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

import type { FullAppSettings } from './lib/defaultSettings.js'
import { normalizeIndianMobile } from './lib/phone.js'
import {
  ensureSettingsSeeded,
  getFullSettings,
  getPublicSettings,
  updateFullSettings,
} from './lib/settingsStore.js'
import { UnloadSubmission } from './models/UnloadSubmission.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const MONGODB_URI = process.env.MONGODB_URI
const PORT = Number(process.env.PORT) || 4000
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'niranjan.19950806@gmail.com')
  .trim()
  .toLowerCase()

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'sayhello'

const outletSchema = z.object({
  name: z.string().trim().min(1).max(200),
  code: z.string().trim().min(1).max(32),
})

const fullSettingsSchema = z.object({
  retailOutlets: z.array(outletSchema).min(1).max(200),
  vehicleNumbers: z
    .array(z.string().trim().min(1).max(48))
    .min(1)
    .max(100),
  routeOptions: z
    .array(z.string().trim().min(1).max(200))
    .min(1)
    .max(100),
  authorizedMobileNumbers: z
    .array(z.string().trim().min(1).max(20))
    .min(1)
    .max(2000),
})

function normalizeSettingsPayload(
  raw: z.infer<typeof fullSettingsSchema>
): FullAppSettings {
  const mobiles = [
    ...new Set(
      raw.authorizedMobileNumbers
        .map((m) => normalizeIndianMobile(m))
        .filter((m) => m.length === 10)
    ),
  ]
  return {
    retailOutlets: raw.retailOutlets.map((o) => ({
      name: o.name.trim(),
      code: o.code.trim(),
    })),
    vehicleNumbers: raw.vehicleNumbers.map((v) => v.trim()),
    routeOptions: raw.routeOptions.map((r) => r.trim()),
    authorizedMobileNumbers: mobiles,
  }
}

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env')
  process.exit(1)
}

if (!ADMIN_JWT_SECRET || ADMIN_JWT_SECRET.length < 16) {
  console.error(
    'Set ADMIN_JWT_SECRET in .env (long random string, at least 16 characters).'
  )
  process.exit(1)
}

const app = express()
app.use(
  cors({
    origin: true,
    credentials: true,
  })
)
app.use(express.json({ limit: '256kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 })
})

app.get('/api/settings', async (_req, res) => {
  try {
    const settings = await getPublicSettings()
    res.json(settings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load settings' })
  }
})

app.post('/api/access/check', async (req, res) => {
  const raw = String((req.body as { rawMobile?: string })?.rawMobile ?? '')
  try {
    const full = await getFullSettings()
    const n = normalizeIndianMobile(raw)
    const allowed =
      n.length === 10 && full.authorizedMobileNumbers.includes(n)
    res.json({ allowed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not verify access' })
  }
})

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const token = h.slice('Bearer '.length).trim()
    const payload = jwt.verify(token, ADMIN_JWT_SECRET) as {
      email?: string
    }
    const email = (payload.email ?? '').toLowerCase()
    if (!email || email !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    ;(req as express.Request & { adminEmail?: string }).adminEmail = email
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' })
  }
}

app.post('/api/admin/session', (req, res) => {
  const body = req.body as { email?: string; password?: string }
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' })
    return
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid email or password.' })
    return
  }

  const token = jwt.sign({ email }, ADMIN_JWT_SECRET, { expiresIn: '8h' })
  res.json({ token, email })
})

app.get('/api/admin/settings', requireAdmin, async (_req, res) => {
  try {
    const full = await getFullSettings()
    res.json(full)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load settings' })
  }
})

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  const parsed = fullSettingsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid settings payload',
      details: parsed.error.flatten(),
    })
    return
  }
  try {
    const normalized = normalizeSettingsPayload(parsed.data)
    const saved = await updateFullSettings(normalized)
    res.json(saved)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not save settings' })
  }
})

app.post('/api/unloads', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const payload = {
    submittedByMobile: String(b.submittedByMobile ?? '').trim(),
    retailOutletCode: String(b.retailOutletCode ?? '').trim(),
    vehicleNo: String(b.vehicleNo ?? '').trim(),
    hpclMograLoadingKg: String(b.hpclMograLoadingKg ?? '').trim(),
    vehicleComingFrom: String(b.vehicleComingFrom ?? '').trim(),
    cascadePressureBefore: String(b.cascadePressureBefore ?? '').trim(),
    initialReadingKg: String(b.initialReadingKg ?? '').trim(),
    finalReadingKg: String(b.finalReadingKg ?? '').trim(),
    cascadePressureAfter: String(b.cascadePressureAfter ?? '').trim(),
    destinationAfter: String(b.destinationAfter ?? '').trim(),
    operatorName: String(b.operatorName ?? '').trim(),
    dateOfVehicleOut: String(b.dateOfVehicleOut ?? '').trim(),
    timeOfVehicleOut: String(b.timeOfVehicleOut ?? '').trim(),
  }

  const missing = Object.entries(payload).filter(([, v]) => v === '')
  if (missing.length > 0) {
    res.status(400).json({
      error: 'Missing required fields',
      fields: missing.map(([k]) => k),
    })
    return
  }

  try {
    const settings = await getFullSettings()
    const mobile = normalizeIndianMobile(payload.submittedByMobile)
    if (
      mobile.length !== 10 ||
      !settings.authorizedMobileNumbers.includes(mobile)
    ) {
      res.status(403).json({ error: 'Mobile number is not authorized' })
      return
    }

    const outletCodes = new Set(
      settings.retailOutlets.map((o) => o.code.trim())
    )
    if (!outletCodes.has(payload.retailOutletCode)) {
      res.status(400).json({ error: 'Invalid retail outlet' })
      return
    }
    const vehicles = new Set(settings.vehicleNumbers.map((v) => v.trim()))
    if (!vehicles.has(payload.vehicleNo)) {
      res.status(400).json({ error: 'Invalid vehicle number' })
      return
    }
    const routes = new Set(settings.routeOptions.map((r) => r.trim()))
    if (
      !routes.has(payload.vehicleComingFrom) ||
      !routes.has(payload.destinationAfter)
    ) {
      res.status(400).json({ error: 'Invalid route selection' })
      return
    }

    const doc = await UnloadSubmission.create(payload)
    res.status(201).json({ id: String(doc._id) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not save submission' })
  }
})

async function main() {
  await mongoose.connect(MONGODB_URI)
  await ensureSettingsSeeded()
  app.listen(PORT, () => {
    console.log(`API http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
