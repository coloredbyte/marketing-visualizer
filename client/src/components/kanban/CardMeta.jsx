import { User, CalendarDays } from 'lucide-react'
import {
  ROLE_OPTIONS,
  TAG_OPTIONS,
  labelFor,
  formatAmount,
  formatDate,
  cardFee,
} from '../../cardFields.js'

// The read-only meta shown on a card face (everything but Notes). Shared by the
// real card and the drag overlay so a dragged card looks identical.
export default function CardMeta({ card, fees }) {
  const role = labelFor(ROLE_OPTIONS, card.role)
  const tag = labelFor(TAG_OPTIONS, card.tag)
  const amount = formatAmount(card.amount)
  const fee = cardFee(card, fees)
  const started = formatDate(card.startedDate, false)
  const finished = formatDate(card.finishedDate, false)

  if (!(card.person || role || tag || amount || started || finished)) return null

  return (
    <div className="kanban-card-meta">
      {card.person && (
        <div className="kanban-card-person">
          <User size={13} /> {card.person}
        </div>
      )}
      {(role || tag) && (
        <div className="kanban-card-pills">
          {role && <span className={'pill pill-' + card.role}>{role}</span>}
          {tag && <span className={'pill pill-' + card.tag}>{tag}</span>}
        </div>
      )}
      {(amount || started || finished) && (
        <div className="kanban-card-facts">
          {amount && <span className="kanban-card-amount">{amount}</span>}
          {fee > 0 && <span className="kanban-card-fee">fee {formatAmount(fee)}</span>}
          {(started || finished) && (
            <span className="kanban-card-dates">
              <CalendarDays size={12} />
              {started || '…'}
              {finished ? ' → ' + finished : ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
