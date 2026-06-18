import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Trash2, X } from 'lucide-react'
import Card from './Card.jsx'

// A single column: editable title, card count, delete, its sortable cards, and
// an inline "add a card" affordance.
export default function Column({
  column,
  onRename,
  onDelete,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onOpenCard,
  fees,
}) {
  const { setNodeRef } = useDroppable({ id: column.id })
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(column.title)
  const [adding, setAdding] = useState(false)
  const [newCard, setNewCard] = useState('')

  const saveTitle = () => {
    const next = title.trim()
    setRenaming(false)
    if (next && next !== column.title) onRename(column.id, next)
    else setTitle(column.title)
  }

  const submitCard = () => {
    const next = newCard.trim()
    if (next) onAddCard(column.id, next)
    setNewCard('')
    setAdding(false)
  }

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        {renaming ? (
          <input
            autoFocus
            className="kanban-column-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle()
              if (e.key === 'Escape') {
                setTitle(column.title)
                setRenaming(false)
              }
            }}
          />
        ) : (
          <>
            <span
              className="kanban-column-title"
              title={column.title}
              onClick={() => setRenaming(true)}
            >
              {column.title}
            </span>
            <span className="kanban-column-count">{column.cards.length}</span>
            <button
              type="button"
              className="icon-btn"
              title="Delete list"
              aria-label="Delete list"
              onClick={() => onDelete(column.id)}
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>

      <div ref={setNodeRef} className="kanban-cards">
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onOpen={onOpenCard}
              fees={fees}
            />
          ))}
        </SortableContext>
        {column.cards.length === 0 && !adding && (
          <div className="kanban-empty">Drop cards here</div>
        )}
      </div>

      {adding ? (
        <div className="kanban-add-card">
          <textarea
            autoFocus
            className="kanban-card-input"
            placeholder="Card title…"
            value={newCard}
            onChange={(e) => setNewCard(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitCard()
              }
              if (e.key === 'Escape') {
                setNewCard('')
                setAdding(false)
              }
            }}
          />
          <div className="kanban-add-actions">
            <button type="button" className="btn-primary" onClick={submitCard}>
              Add card
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Cancel"
              onClick={() => {
                setNewCard('')
                setAdding(false)
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="kanban-add-trigger" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add a card
        </button>
      )}
    </div>
  )
}
