// Structured fields stored on each Kanban card. The server treats cards as
// schemaless (it spreads/preserves arbitrary keys), so these live entirely on
// the client. Add a field by extending the options/formatters here and the
// detail panel + card face.

export const ROLE_OPTIONS = [
  { value: 'im_hiring', label: "I'm Hiring" },
  { value: 'hiring_me', label: 'Hiring me' },
]

export const TAG_OPTIONS = [
  { value: 'upwork', label: 'Upwork' },
  { value: 'fiverr', label: 'Fiverr' },
]

export const labelFor = (options, value) =>
  options.find((o) => o.value === value)?.label || ''

// Defaults applied when a new card is created.
export const DEFAULT_TAG = 'upwork'

// Local YYYY-MM-DD for today (built from local parts to avoid UTC off-by-one).
export function todayISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function formatAmount(amount) {
  if (amount === '' || amount === null || amount === undefined) return ''
  const n = Number(amount)
  if (Number.isNaN(n)) return ''
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// Role → fee side. I'm Hiring = buyer, Hiring me = seller.
export function feeSide(role) {
  if (role === 'im_hiring') return 'buyer'
  if (role === 'hiring_me') return 'seller'
  return null
}

// The fee % that applies to a card given the board's fee settings, or null if
// it can't be determined (missing role or platform).
export function feePct(card, fees) {
  const side = feeSide(card?.role)
  if (!side || !card?.tag) return null
  const pct = Number(fees?.[card.tag]?.[side])
  return Number.isFinite(pct) ? pct : null
}

// Auto-calculated card fee = Amount × applicable fee%. 0 when not determinable.
export function cardFee(card, fees) {
  const pct = feePct(card, fees)
  if (pct == null) return 0
  return ((Number(card?.amount) || 0) * pct) / 100
}

export function formatDate(iso, withYear = true) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}
