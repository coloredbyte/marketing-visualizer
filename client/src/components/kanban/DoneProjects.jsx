import { RotateCcw } from 'lucide-react'
import CardMeta from './CardMeta.jsx'
import { formatDate } from '../../cardFields.js'

// Done Projects view: completed cards (newest first). Click to open the detail
// panel; restore to send a card back to its board column.
export default function DoneProjects({ done, fees, onOpen, onRestore }) {
  if (!done) return <div className="card">Loading…</div>
  if (done.length === 0) {
    return (
      <div className="card">
        No completed projects yet. On the Exchanges tab, drag a card onto “Drop
        here to complete”.
      </div>
    )
  }

  return (
    <div className="done-grid">
      {done.map((card) => (
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
          <CardMeta card={card} fees={fees} />
          <div className="done-card-finished">Finished {formatDate(card.finishedDate)}</div>
        </div>
      ))}
    </div>
  )
}
