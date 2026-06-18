// Tiny fetch wrapper for the Express API. All calls go through `/api/*`, which
// Vite proxies to the backend in dev and Express serves directly in prod.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json())?.error || ''
    } catch {
      /* no JSON body */
    }
    throw new Error(detail || `Request failed (${res.status})`)
  }
  // 204 No Content (e.g. deletes) has no body to parse.
  if (res.status === 204) return null
  return res.json()
}

const body = (data) => ({ body: JSON.stringify(data) })

export const api = {
  health: () => request('/health'),

  // ---- Kanban ----
  getBoard: (boardId) => request(`/kanban/${boardId}/board`),
  getDone: (boardId) => request(`/kanban/${boardId}/done`),
  restoreCard: (cardId) => request(`/kanban/cards/${cardId}/restore`, { method: 'POST' }),

  addColumn: (boardId, title) =>
    request(`/kanban/${boardId}/columns`, { method: 'POST', ...body({ title }) }),
  updateColumn: (columnId, fields) =>
    request(`/kanban/columns/${columnId}`, { method: 'PATCH', ...body(fields) }),
  deleteColumn: (columnId) =>
    request(`/kanban/columns/${columnId}`, { method: 'DELETE' }),

  addCard: (columnId, fields) =>
    request(`/kanban/columns/${columnId}/cards`, { method: 'POST', ...body(fields) }),
  updateCard: (cardId, fields) =>
    request(`/kanban/cards/${cardId}`, { method: 'PATCH', ...body(fields) }),
  deleteCard: (cardId) =>
    request(`/kanban/cards/${cardId}`, { method: 'DELETE' }),
  moveCard: (cardId, toColumnId, toIndex) =>
    request(`/kanban/cards/${cardId}/move`, {
      method: 'POST',
      ...body({ toColumnId, toIndex }),
    }),

  // ---- Settings ----
  getFees: (boardId) => request(`/settings/fees/${boardId}`),
  updateFees: (boardId, fields) =>
    request(`/settings/fees/${boardId}`, { method: 'PATCH', ...body(fields) }),

  // ---- Airtable ----
  getAirtableConfig: () => request('/airtable/config'),
  saveAirtableConfig: (fields) => request('/airtable/config', { method: 'PUT', ...body(fields) }),
  getAirtableTables: (baseId) =>
    request(`/airtable/tables?baseId=${encodeURIComponent(baseId)}`),
  getAirtableRecords: (baseId, table, maxRecords = 100) =>
    request(
      `/airtable/records?baseId=${encodeURIComponent(baseId)}&table=${encodeURIComponent(table)}&maxRecords=${maxRecords}`,
    ),
}
