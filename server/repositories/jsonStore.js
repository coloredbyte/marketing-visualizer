import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, '..', 'data', 'board.json')

// Seed used the first time the app runs (no data file yet). Records are kept
// flat with ids so the eventual move to Postgres (Neon) is a straight mapping
// to rows, not a reshape.
const SEED = {
  columns: [
    {
      id: 'col-todo',
      title: 'To Do',
      cards: [
        { id: 'card-1', title: 'Connect first Airtable base' },
        { id: 'card-2', title: 'Draft dashboard metrics' },
      ],
    },
    { id: 'col-doing', title: 'In Progress', cards: [{ id: 'card-3', title: 'Build scaffold' }] },
    { id: 'col-done', title: 'Done', cards: [] },
  ],
}

async function read() {
  if (!existsSync(DATA_FILE)) {
    await write(SEED)
    return SEED
  }
  return JSON.parse(await readFile(DATA_FILE, 'utf-8'))
}

async function write(board) {
  await writeFile(DATA_FILE, JSON.stringify(board, null, 2), 'utf-8')
}

// Implements the kanbanRepo interface. A future neonStore.js exposes the same
// method names; db.js decides which one is active.
export const jsonStore = {
  async getBoard() {
    return read()
  },
}
