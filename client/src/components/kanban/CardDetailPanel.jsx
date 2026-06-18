import { useEffect, useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import {
  ROLE_OPTIONS,
  TAG_OPTIONS,
  cardFee,
  feePct,
  feeSide,
  formatAmount,
} from '../../cardFields.js'
import DatePicker from './DatePicker.jsx'

// Right-side drawer for viewing/editing every field on a card. Text fields
// persist on blur; selects and dates persist immediately. A local draft holds
// in-progress edits so background board reloads don't clobber typing.
export default function CardDetailPanel({ card, onClose, onSave, onDelete, fees }) {
  const [draft, setDraft] = useState(card || {})

  // Re-sync only when a different card is opened.
  useEffect(() => {
    setDraft(card || {})
  }, [card?.id])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!card) return null

  const set = (field, val) => setDraft((d) => ({ ...d, [field]: val }))
  const persist = (patch) => onSave(card.id, patch)
  const setAndPersist = (field, val) => {
    set(field, val)
    persist({ [field]: val })
  }
  // Click an active option again to clear it.
  const toggle = (field, val) => setAndPersist(field, draft[field] === val ? '' : val)

  return (
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <aside className="detail-panel" role="dialog" aria-label="Card details">
        <div className="detail-header">
          <h2>Card details</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="detail-body">
          <label className="detail-field">
            <span>Member name</span>
            <input
              value={draft.title || ''}
              onChange={(e) => set('title', e.target.value)}
              onBlur={() => persist({ title: (draft.title || '').trim() || card.title })}
            />
          </label>

          <label className="detail-field">
            <span>Account name</span>
            <input
              value={draft.person || ''}
              placeholder="Account name"
              onChange={(e) => set('person', e.target.value)}
              onBlur={() => persist({ person: draft.person || '' })}
            />
          </label>

          <div className="detail-field">
            <span>Role</span>
            <div className="segmented">
              {ROLE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={'seg' + (draft.role === o.value ? ' is-on' : '')}
                  onClick={() => toggle('role', o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-field">
            <span>Tag</span>
            <div className="segmented">
              {TAG_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={'seg' + (draft.tag === o.value ? ' is-on' : '')}
                  onClick={() => toggle('tag', o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <label className="detail-field">
            <span>Amount (USD)</span>
            <div className="input-prefixed">
              <span className="prefix">$</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={draft.amount ?? ''}
                onChange={(e) => set('amount', e.target.value)}
                onBlur={() =>
                  persist({ amount: draft.amount === '' ? null : Number(draft.amount) })
                }
              />
            </div>
          </label>

          <div className="detail-field">
            <span>Fee (auto)</span>
            <div className="detail-readonly">
              {feePct(draft, fees) == null ? (
                <span className="muted">Set role &amp; platform to calculate</span>
              ) : (
                <>
                  <strong>{formatAmount(cardFee(draft, fees))}</strong>
                  <span className="muted">
                    {feePct(draft, fees)}% · {draft.tag} {feeSide(draft.role)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="detail-row">
            <div className="detail-field">
              <span>Started</span>
              <DatePicker
                value={draft.startedDate || ''}
                onChange={(v) => setAndPersist('startedDate', v)}
              />
            </div>
            <div className="detail-field">
              <span>Finished</span>
              <DatePicker
                value={draft.finishedDate || ''}
                onChange={(v) => setAndPersist('finishedDate', v)}
              />
            </div>
          </div>

          <label className="detail-field">
            <span>Notes</span>
            <textarea
              rows="6"
              value={draft.notes || ''}
              placeholder="Anything worth remembering…"
              onChange={(e) => set('notes', e.target.value)}
              onBlur={() => persist({ notes: draft.notes || '' })}
            />
          </label>

          <button type="button" className="detail-delete" onClick={() => onDelete(card.id)}>
            <Trash2 size={15} /> Delete card
          </button>
        </div>
      </aside>
    </>
  )
}
