import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2 } from 'lucide-react'

// A draggable, inline-editable card. Click the title to rename; trash to delete.
export default function Card({ card, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(card.title)
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
    <div ref={setNodeRef} style={style} className="kanban-card" {...attributes} {...listeners}>
      <span className="kanban-card-title" onClick={() => setEditing(true)}>
        {card.title}
      </span>
      <button
        type="button"
        className="icon-btn kanban-card-delete"
        onClick={() => onDelete(card.id)}
        onPointerDown={(e) => e.stopPropagation()}
        title="Delete card"
        aria-label="Delete card"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
