import { Router } from 'express'
import { kanbanRepo } from '../db.js'

const router = Router()

// All routes wrapped so async errors reach the error handler.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next)

// ---- Board ----
// GET /api/kanban/:boardId/board — assembled board (active cards only).
router.get(
  '/:boardId/board',
  wrap(async (req, res) => {
    const board = await kanbanRepo.getBoardView(req.params.boardId)
    if (!board) return res.status(404).json({ error: 'Board not found' })
    res.json(board)
  }),
)

// GET /api/kanban/:boardId/done — completed cards (have a Finished date).
router.get(
  '/:boardId/done',
  wrap(async (req, res) => {
    res.json(await kanbanRepo.getDoneCards(req.params.boardId))
  }),
)

// POST /api/kanban/cards/:cardId/restore — un-complete a card back to the board.
router.post(
  '/cards/:cardId/restore',
  wrap(async (req, res) => {
    const card = await kanbanRepo.restoreCard(req.params.cardId)
    if (!card) return res.status(404).json({ error: 'Card not found' })
    res.json(card)
  }),
)

// ---- Columns ----
router.post(
  '/:boardId/columns',
  wrap(async (req, res) => {
    const title = (req.body.title || '').trim()
    if (!title) return res.status(400).json({ error: 'title is required' })
    res.status(201).json(await kanbanRepo.addColumn(req.params.boardId, title))
  }),
)

router.patch(
  '/columns/:columnId',
  wrap(async (req, res) => {
    const updated = await kanbanRepo.updateColumn(req.params.columnId, req.body)
    if (!updated) return res.status(404).json({ error: 'Column not found' })
    res.json(updated)
  }),
)

router.delete(
  '/columns/:columnId',
  wrap(async (req, res) => {
    const ok = await kanbanRepo.deleteColumn(req.params.columnId)
    if (!ok) return res.status(404).json({ error: 'Column not found' })
    res.status(204).end()
  }),
)

// ---- Cards ----
router.post(
  '/columns/:columnId/cards',
  wrap(async (req, res) => {
    const card = await kanbanRepo.addCard(req.params.columnId, req.body || {})
    if (!card) return res.status(404).json({ error: 'Column not found' })
    res.status(201).json(card)
  }),
)

router.patch(
  '/cards/:cardId',
  wrap(async (req, res) => {
    const card = await kanbanRepo.updateCard(req.params.cardId, req.body || {})
    if (!card) return res.status(404).json({ error: 'Card not found' })
    res.json(card)
  }),
)

router.delete(
  '/cards/:cardId',
  wrap(async (req, res) => {
    const ok = await kanbanRepo.deleteCard(req.params.cardId)
    if (!ok) return res.status(404).json({ error: 'Card not found' })
    res.status(204).end()
  }),
)

// POST /api/kanban/cards/:cardId/move — body { toColumnId, toIndex }
router.post(
  '/cards/:cardId/move',
  wrap(async (req, res) => {
    const { toColumnId, toIndex } = req.body || {}
    const card = await kanbanRepo.moveCard(
      req.params.cardId,
      toColumnId,
      Number(toIndex) || 0,
    )
    if (!card) return res.status(400).json({ error: 'Invalid move' })
    res.json(card)
  }),
)

export default router
