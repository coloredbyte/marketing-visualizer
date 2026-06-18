import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import kanbanRoutes from './routes/kanban.js'
import settingsRoutes from './routes/settings.js'
import airtableRoutes from './routes/airtable.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001

const app = express()
app.use(express.json())

// ---- API ----
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})
app.use('/api/kanban', kanbanRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/airtable', airtableRoutes)

// ---- Serve built frontend in production (what Render runs) ----
// In dev the Vite server handles the UI and proxies /api here, so this block
// is only active once client/dist exists.
const clientDist = join(__dirname, '..', 'client', 'dist')
if (existsSync(clientDist)) {
  app.use(express.static(clientDist))
  // SPA fallback: send index.html for any non-API route.
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'))
  })
}

// ---- Error handler ----
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
