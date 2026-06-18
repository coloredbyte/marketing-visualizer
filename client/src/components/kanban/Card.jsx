import { useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, User, CalendarDays } from 'lucide-react'
import {
  ROLE_OPTIONS,
  TAG_OPTIONS,
  labelFor,
  formatAmount,
  formatDate,
} from '../../cardFields.js'

// A draggable card. Click the title to rename inline; click elsewhere on the
// card to open the detail panel; trash to delete. Everything but Notes is
// surfaced on the card face.
export default function Card({ card, onEdit, onDelete, onOpen }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(card.title)
  const downPos = useRef(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const save = () => {
    const next = value.trim()
    setEditing(false)
    if (next && next !== card.title) onEdit(card.id, { title: next })
    else setValue(card.title)
  }

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className="kanban-card is-editing">
        <textarea
          autoFocus
          className="kanban-card-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              save()
            }
            if (e.key === 'Escape') {
              setValue(card.title)
              setEditing(false)
            }
          }}
        />
      </div>
    )
  }

  const role = labelFor(ROLE_OPTIONS, card.role)
  const tag = labelFor(TAG_OPTIONS, card.tag)
  const amount = formatAmount(card.amount)
  const started = formatDate(card.startedDate, false)
  const finished = formatDate(card.finishedDate, false)
  const hasMeta = card.person || role || tag || amount || started || finished

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-card"
      {...attributes}
      {...listeners}
      onPointerDownCapture={(e) => {
        downPos.current = { x: e.clientX, y: e.clientY }
      }}
      onClick={(e) => {
        // Ignore the click that follows an actual drag.
        const d = downPos.current
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return
        onOpen(card.id)
      }}
    >
      <div className="kanban-card-top">
        <span
          className="kanban-card-title"
          onClick={(e) => {
            e.stopPropagation()
            setEditing(true)
          }}
        >
          {card.title}
        </span>
        <button
          type="button"
          className="icon-btn kanban-card-delete"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(card.id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Delete card"
          aria-label="Delete card"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {hasMeta && (
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
      )}
    </div>
  )
}
