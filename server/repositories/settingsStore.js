import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE = join(__dirname, '..', 'data', 'settings.json')

// Per-board platform fees, split by side (buyer vs seller). Sensible defaults;
// the user overrides them in Settings.
const DEFAULT_FEES = {
  upwork: { buyer: 5, seller: 10 },
  fiverr: { buyer: 5, seller: 20 },
}

let chain = Promise.resolve()
function withLock(fn) {
  const result = chain.then(fn, fn)
  chain = result.then(
    () => {},
    () => {},
  )
  return result
}

async function load() {
  if (!existsSync(FILE)) return { fees: {} }
  return JSON.parse(await readFile(FILE, 'utf-8'))
}

async function save(data) {
  await writeFile(FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// Stored fees layered over defaults so every platform/side returns a number.
function merge(stored) {
  const s = stored || {}
  return {
    upwork: { ...DEFAULT_FEES.upwork, ...(typeof s.upwork === 'object' ? s.upwork : {}) },
    fiverr: { ...DEFAULT_FEES.fiverr, ...(typeof s.fiverr === 'object' ? s.fiverr : {}) },
  }
}

export const settingsStore = {
  getFees(boardId) {
    return withLock(async () => {
      const data = await load()
      return merge(data.fees?.[boardId])
    })
  },

  // Accepts a partial patch, e.g. { upwork: { buyer: 5 } }.
  setFees(boardId, patch) {
    return withLock(async () => {
      const data = await load()
      data.fees = data.fees || {}
      const next = merge(data.fees[boardId])
      for (const platform of ['upwork', 'fiverr']) {
        const p = patch?.[platform]
        if (p && typeof p === 'object') {
          for (const side of ['buyer', 'seller']) {
            if (p[side] !== undefined) next[platform][side] = Number(p[side]) || 0
          }
        }
      }
      data.fees[boardId] = next
      await save(data)
      return next
    })
  },
}
