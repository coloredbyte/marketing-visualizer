import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Lives in server/data (gitignored) so the token is never committed.
const FILE = join(__dirname, '..', 'data', 'airtable.json')

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
  if (!existsSync(FILE)) return {}
  const d = JSON.parse(await readFile(FILE, 'utf-8'))
  // Migrate the old single-base shape ({ baseId }) into the bases list.
  if (d.baseId && !(d.bases && d.bases.length)) {
    d.bases = [{ id: randomUUID(), label: '', baseId: d.baseId }]
  }
  delete d.baseId
  return d
}
async function save(data) {
  await writeFile(FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// Safe shape for the browser — never includes the raw token.
function publicView(d) {
  const token = d.token || ''
  const bases = (d.bases || []).map((b) => ({ id: b.id, label: b.label || '', baseId: b.baseId || '' }))
  return {
    connected: !!(token && bases.length),
    hasToken: !!token,
    tokenHint: token ? token.slice(-4) : '',
    bases,
  }
}

export const airtableStore = {
  // Full config — server-side use only.
  getConfig() {
    return withLock(async () => {
      const d = await load()
      return { token: d.token || '', bases: d.bases || [] }
    })
  },

  getPublicConfig() {
    return withLock(async () => publicView(await load()))
  },

  // Accepts { token?, bases? }. Token only overwritten when non-empty (so the
  // base list can be edited without re-entering it). bases replaces the list.
  setConfig(fields) {
    return withLock(async () => {
      const d = await load()
      if (typeof fields.token === 'string' && fields.token.trim() !== '') {
        d.token = fields.token.trim()
      }
      if (Array.isArray(fields.bases)) {
        d.bases = fields.bases
          .map((b) => ({
            id: b.id || randomUUID(),
            label: (b.label || '').trim(),
            baseId: (b.baseId || '').trim(),
          }))
          .filter((b) => b.baseId) // drop blank rows
      }
      await save(d)
      return publicView(d)
    })
  },
}
