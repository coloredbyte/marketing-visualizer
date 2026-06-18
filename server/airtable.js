import { airtableStore } from './repositories/airtableStore.js'

const API = 'https://api.airtable.com/v0'

async function requireToken() {
  const c = await airtableStore.getConfig()
  if (!c.token) {
    const e = new Error('Airtable is not configured. Add a token and a base in Settings.')
    e.status = 400
    throw e
  }
  return c
}

function ensureBase(config, baseId) {
  if (!baseId) {
    const e = new Error('baseId is required')
    e.status = 400
    throw e
  }
  if (!(config.bases || []).some((b) => b.baseId === baseId)) {
    const e = new Error('Unknown base — add it in Settings first.')
    e.status = 400
    throw e
  }
}

async function airtableFetch(url, token) {
  let res
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  } catch {
    const e = new Error('Could not reach Airtable.')
    e.status = 502
    throw e
  }
  if (!res.ok) {
    let message = `Airtable request failed (${res.status})`
    let type = ''
    try {
      const body = await res.json()
      message = body?.error?.message || body?.error?.type || message
      type = body?.error?.type || ''
    } catch {
      /* non-JSON error body */
    }
    // Log status + type for debugging (never the token — it's in the header).
    console.warn(`[airtable] ${res.status} ${type || ''} ${message} :: ${url}`)
    const e = new Error(message)
    e.status = res.status === 401 || res.status === 403 ? res.status : 502
    throw e
  }
  return res.json()
}

// Schema introspection via the Metadata API (needs schema.bases:read scope).
export async function listTables(baseId) {
  const config = await requireToken()
  ensureBase(config, baseId)
  const data = await airtableFetch(`${API}/meta/bases/${baseId}/tables`, config.token)
  return (data.tables || []).map((t) => ({
    id: t.id,
    name: t.name,
    fields: (t.fields || []).map((f) => ({ id: f.id, name: f.name, type: f.type })),
  }))
}

// Records for a table (flattened: { id, ...fields }). Pages through Airtable's
// 100-per-request limit up to maxRecords so dashboard aggregates are complete.
export async function listRecords(baseId, table, { maxRecords = 1000 } = {}) {
  const config = await requireToken()
  ensureBase(config, baseId)
  const out = []
  let offset
  do {
    const params = new URLSearchParams({ pageSize: String(Math.min(100, maxRecords)) })
    if (offset) params.set('offset', offset)
    const url = `${API}/${baseId}/${encodeURIComponent(table)}?${params}`
    const data = await airtableFetch(url, config.token)
    for (const r of data.records || []) out.push({ id: r.id, ...r.fields })
    offset = data.offset
  } while (offset && out.length < maxRecords)
  return out.slice(0, maxRecords)
}
