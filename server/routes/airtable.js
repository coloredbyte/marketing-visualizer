import { Router } from 'express'
import { airtableStore } from '../repositories/airtableStore.js'
import { listTables, listRecords } from '../airtable.js'

const router = Router()
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next)

// Surface Airtable/config errors with their status + message.
const proxy = (fn) =>
  wrap(async (req, res) => {
    try {
      res.json(await fn(req))
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message })
    }
  })

// ---- Connection config (token never returned) ----
router.get('/config', wrap(async (_req, res) => res.json(await airtableStore.getPublicConfig())))
router.put('/config', wrap(async (req, res) => res.json(await airtableStore.setConfig(req.body || {}))))

// ---- Proxied data (baseId selects which configured base) ----
router.get('/tables', proxy((req) => listTables(req.query.baseId)))
router.get(
  '/records',
  proxy((req) => {
    if (!req.query.table) {
      const e = new Error('table is required')
      e.status = 400
      throw e
    }
    return listRecords(req.query.baseId, req.query.table, {
      maxRecords: Number(req.query.maxRecords) || 100,
    })
  }),
)

export default router
