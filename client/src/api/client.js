// Tiny fetch wrapper for the Express API. All calls go through `/api/*`, which
// Vite proxies to the backend in dev and Express serves directly in prod.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  health: () => request('/health'),
  getBoard: () => request('/kanban/board'),
}
