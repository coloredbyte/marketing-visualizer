import { useMemo, useState } from 'react'
import { RotateCcw, User, X, Search } from 'lucide-react'
import { ROLE_OPTIONS, TAG_OPTIONS, labelFor } from '../../cardFields.js'
import DatePicker from './DatePicker.jsx'

const EMPTY = {
  name: '',
  tags: [],
  roles: [],
  amountMin: '',
  amountMax: '',
  dateFrom: '',
  dateTo: '',
}

// Filter the done list. Dates match on the Finished date (range).
function applyFilters(cards, f) {
  const name = f.name.trim().toLowerCase()
  const min = f.amountMin === '' ? null : Number(f.amountMin)
  const max = f.amountMax === '' ? null : Number(f.amountMax)
  return cards.filter((c) => {
    if (name && !`${c.title || ''} ${c.person || ''}`.toLowerCase().includes(name)) return false
    if (f.tags.length && !f.tags.includes(c.tag)) return false
    if (f.roles.length && !f.roles.includes(c.role)) return false
    const amt = Number(c.amount) || 0
    if (min != null && amt < min) return false
    if (max != null && amt > max) return false
    if (f.dateFrom && (!c.finishedDate || c.finishedDate < f.dateFrom)) return false
    if (f.dateTo && (!c.finishedDate || c.finishedDate > f.dateTo)) return false
    return true
  })
}

export default function DoneProjects({ done, onOpen, onRestore }) {
  const [f, setF] = useState(EMPTY)
  const filtered = useMemo(() => (done ? applyFilters(done, f) : []), [done, f])
  const active = JSON.stringify(f) !== JSON.stringify(EMPTY)

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const toggleIn = (k, v) =>
    setF((p) => ({
      ...p,
      [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v],
    }))

  if (!done) return <div className="card">Loading…</div>

  return (
    <div>
      <div className="done-filters">
        <div className="done-filter-search">
          <Search size={15} />
          <input
            placeholder="Search…"
            size={Math.max(14, f.name.length + 2)}
            value={f.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        <div className="done-filter-controls">
          <div className="done-filter-group">
            {TAG_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={'filter-chip' + (f.tags.includes(o.value) ? ' is-on' : '')}
              onClick={() => toggleIn('tags', o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="done-filter-group">
          {ROLE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={'filter-chip' + (f.roles.includes(o.value) ? ' is-on' : '')}
              onClick={() => toggleIn('roles', o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="done-filter-amount">
          <input
            type="number"
            min="0"
            placeholder="Min $"
            value={f.amountMin}
            onChange={(e) => set('amountMin', e.target.value)}
          />
          <span>–</span>
          <input
            type="number"
            min="0"
            placeholder="Max $"
            value={f.amountMax}
            onChange={(e) => set('amountMax', e.target.value)}
          />
        </div>

        <div className="done-filter-dates">
          <DatePicker value={f.dateFrom} onChange={(v) => set('dateFrom', v)} placeholder="From" />
          <span>–</span>
          <DatePicker
            value={f.dateTo}
            onChange={(v) => set('dateTo', v)}
            placeholder="To"
            align="right"
          />
        </div>

          {active && (
            <button type="button" className="filter-clear" onClick={() => setF(EMPTY)}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="done-count">
        {filtered.length} of {done.length}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          {done.length === 0
            ? 'No completed projects yet. On the Exchanges tab, drag a card onto “Drop here to complete”.'
            : 'No projects match these filters.'}
        </div>
      ) : (
        <div className="done-grid">
          {filtered.map((card) => {
            const role = labelFor(ROLE_OPTIONS, card.role)
            const tag = labelFor(TAG_OPTIONS, card.tag)
            return (
              <div key={card.id} className="done-card" onClick={() => onOpen(card.id)}>
                <div className="kanban-card-top">
                  <span className="kanban-card-title">{card.title}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    title="Restore to board"
                    aria-label="Restore to board"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRestore(card.id)
                    }}
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
                {card.person && (
                  <div className="done-card-account">
                    <User size={13} /> {card.person}
                  </div>
                )}
                {(role || tag) && (
                  <div className="kanban-card-pills">
                    {role && <span className={'pill pill-' + card.role}>{role}</span>}
                    {tag && <span className={'pill pill-' + card.tag}>{tag}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
