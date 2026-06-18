import { Router } from 'express'
import { settingsStore } from '../db.js'

const router = Router()
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next)

// GET /api/settings/fees/:boardId — platform fee % for a board (merged w/ defaults)
router.get(
  '/fees/:boardId',
  wrap(async (req, res) => {
    res.json(await settingsStore.getFees(req.params.boardId))
  }),
)

// PATCH /api/settings/fees/:boardId — body { upwork?, fiverr? }
router.patch(
  '/fees/:boardId',
  wrap(async (req, res) => {
    res.json(await settingsStore.setFees(req.params.boardId, req.body || {}))
  }),
)

export default router
