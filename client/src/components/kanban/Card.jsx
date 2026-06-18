import { useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2 } from 'lucide-react'
import CardMeta from './CardMeta.jsx'

// A draggable card. Click the title to rename inline; click elsewhere on the
// card to open the detail panel; trash to delete. Everything but Notes is
// surfaced on the card face.
export default function Card({ card, onEdit, onDelete, onOpen, fees }) {
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

      <CardMeta card={card} fees={fees} />
    </div>
  )
}
