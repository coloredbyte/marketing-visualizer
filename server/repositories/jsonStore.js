import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, '..', 'data', 'board.json')

// Flat, relational-shaped records (boards / columns / cards) so the eventual
// move to Postgres (Neon) maps straight to three tables. Cards keep arbitrary
// extra fields untouched, so adding card properties later needs no schema work.
function seed() {
  const boards = [
    { id: 'lucas', name: 'Lucas' },
    { id: 'gustavo', name: 'Gustavo' },
  ]
  const columns = []
  const cards = []
  for (const board of boards) {
    const titles = ['To Do', 'In Progress', 'Done']
    titles.forEach((title, position) => {
      const colId = randomUUID()
      columns.push({ id: colId, boardId: board.id, title, position })
      if (position === 0) {
        cards.push({
          id: randomUUID(),
          columnId: colId,
          title: `${board.name}'s first task`,
          position: 0,
        })
      }
    })
  }
  return { boards, columns, cards }
}

async function load() {
  if (!existsSync(DATA_FILE)) {
    const data = seed()
    await save(data)
    return data
  }
  return JSON.parse(await readFile(DATA_FILE, 'utf-8'))
}

async function save(data) {
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

const byPosition = (a, b) => a.position - b.position

// Renumber positions of a set of records to a clean 0..n sequence.
function renumber(records) {
  records.sort(byPosition).forEach((r, i) => {
    r.position = i
  })
}

export const jsonStore = {
  // ---- Reads ----
  async getBoardView(boardId) {
    const data = await load()
    const board = data.boards.find((b) => b.id === boardId)
    if (!board) return null
    const columns = data.columns
      .filter((c) => c.boardId === boardId)
      .sort(byPosition)
      .map((col) => ({
        id: col.id,
        title: col.title,
        position: col.position,
        cards: data.cards
          .filter((card) => card.columnId === col.id)
          .sort(byPosition),
      }))
    return { id: board.id, name: board.name, columns }
  },

  // ---- Columns ----
  async addColumn(boardId, title) {
    const data = await load()
    const siblings = data.columns.filter((c) => c.boardId === boardId)
    const column = {
      id: randomUUID(),
      boardId,
      title,
      position: siblings.length,
    }
    data.columns.push(column)
    await save(data)
    return column
  },

  async updateColumn(columnId, fields) {
    const data = await load()
    const column = data.columns.find((c) => c.id === columnId)
    if (!column) return null
    if (typeof fields.title === 'string') column.title = fields.title
    await save(data)
    return column
  },

  async deleteColumn(columnId) {
    const data = await load()
    const column = data.columns.find((c) => c.id === columnId)
    if (!column) return false
    data.columns = data.columns.filter((c) => c.id !== columnId)
    data.cards = data.cards.filter((card) => card.columnId !== columnId)
    renumber(data.columns.filter((c) => c.boardId === column.boardId))
    await save(data)
    return true
  },

  // ---- Cards ----
  async addCard(columnId, fields) {
    const data = await load()
    if (!data.columns.some((c) => c.id === columnId)) return null
    const siblings = data.cards.filter((card) => card.columnId === columnId)
    const card = {
      id: randomUUID(),
      columnId,
      position: siblings.length,
      title: fields.title || 'Untitled',
      ...fields,
    }
    data.cards.push(card)
    await save(data)
    return card
  },

  async updateCard(cardId, fields) {
    const data = await load()
    const card = data.cards.find((c) => c.id === cardId)
    if (!card) return null
    // Never let a client overwrite identity/placement via a plain edit.
    const { id, columnId, position, ...rest } = fields
    Object.assign(card, rest)
    await save(data)
    return card
  },

  async deleteCard(cardId) {
    const data = await load()
    const card = data.cards.find((c) => c.id === cardId)
    if (!card) return false
    const columnId = card.columnId
    data.cards = data.cards.filter((c) => c.id !== cardId)
    renumber(data.cards.filter((c) => c.columnId === columnId))
    await save(data)
    return true
  },

  async moveCard(cardId, toColumnId, toIndex) {
    const data = await load()
    const card = data.cards.find((c) => c.id === cardId)
    if (!card) return null
    if (!data.columns.some((c) => c.id === toColumnId)) return null
    const fromColumnId = card.columnId

    const target = data.cards
      .filter((c) => c.columnId === toColumnId && c.id !== cardId)
      .sort(byPosition)
    card.columnId = toColumnId
    const idx = Math.max(0, Math.min(toIndex, target.length))
    target.splice(idx, 0, card)
    target.forEach((c, i) => {
      c.position = i
    })

    if (fromColumnId !== toColumnId) {
      renumber(data.cards.filter((c) => c.columnId === fromColumnId))
    }
    await save(data)
    return card
  },
}
