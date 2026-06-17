import { Router } from 'express'
import { kanbanRepo } from '../db.js'

const router = Router()

// GET /api/kanban/board — full board (columns + cards).
// Step 2 will add POST/PATCH/DELETE for cards and columns.
router.get('/board', async (_req, res, next) => {
  try {
    res.json(await kanbanRepo.getBoard())
  } catch (err) {
    next(err)
  }
})

export default router
