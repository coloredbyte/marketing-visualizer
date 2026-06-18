import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus, X } from 'lucide-react'
import { api } from '../api/client.js'
import { DEFAULT_TAG, todayISO } from '../cardFields.js'
import Column from '../components/kanban/Column.jsx'
import CardMeta from '../components/kanban/CardMeta.jsx'
import CardDetailPanel from '../components/kanban/CardDetailPanel.jsx'

// Locate a card or column id within the current board view.
function locate(view, id) {
  if (!view) return null
  if (view.columns.some((c) => c.id === id)) return { colId: id, isColumn: true, index: -1 }
  for (const col of view.columns) {
    const index = col.cards.findIndex((c) => c.id === id)
    if (index >= 0) return { colId: col.id, isColumn: false, index }
  }
  return null
}

export default function Kanban() {
  const { boardId } = useParams()
  const [view, setView] = useState(null)
  const [error, setError] = useState(null)
  const [activeCard, setActiveCard] = useState(null)
  const [activeWidth, setActiveWidth] = useState(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumn, setNewColumn] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  // The currently-open card, derived fresh from the board each render so the
  // panel reflects saved edits.
  const selectedCard = view
    ? view.columns.flatMap((c) => c.cards).find((c) => c.id === selectedId) || null
    : null

  // Keep a ref in lockstep with state so drag handlers read the latest board
  // without waiting for a re-render.
  const viewRef = useRef(null)
  const setBoard = useCallback((next) => {
    viewRef.current = next
    setView(next)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const load = useCallback(() => {
    setError(null)
    api
      .getBoard(boardId)
      .then(setBoard)
      .catch(() => setError('Could not load board'))
  }, [boardId, setBoard])

  useEffect(() => {
    setBoard(null)
    setSelectedId(null)
    load()
  }, [load, setBoard])

  // ---- CRUD (reload after each mutation to stay in sync) ----
  const addColumnSubmit = () => {
    const title = newColumn.trim()
    setNewColumn('')
    setAddingColumn(false)
    if (title) api.addColumn(boardId, title).then(load).catch(load)
  }
  const renameColumn = (id, title) => api.updateColumn(id, { title }).then(load).catch(load)
  const deleteColumn = (id) => {
    if (!window.confirm('Delete this list and all its cards?')) return
    api.deleteColumn(id).then(load).catch(load)
  }
  const addCard = (columnId, title) =>
    api
      .addCard(columnId, { title, tag: DEFAULT_TAG, startedDate: todayISO() })
      .then(load)
      .catch(load)
  const editCard = (id, fields) => api.updateCard(id, fields).then(load).catch(load)
  const deleteCard = (id) => api.deleteCard(id).then(load).catch(load)
  const deleteCardFromPanel = (id) => {
    setSelectedId(null)
    deleteCard(id)
  }

  // ---- Drag and drop ----
  const onDragStart = ({ active }) => {
    const loc = locate(viewRef.current, active.id)
    if (loc && !loc.isColumn) {
      const col = viewRef.current.columns.find((c) => c.id === loc.colId)
      setActiveCard(col.cards[loc.index])
    }
    // Match the overlay to the width of the card actually grabbed.
    setActiveWidth(active.rect?.current?.initial?.width ?? null)
  }

  // Live cross-column movement while dragging.
  const onDragOver = ({ active, over }) => {
    if (!over) return
    const d = viewRef.current
    const a = locate(d, active.id)
    const o = locate(d, over.id)
    if (!a || !o || a.colId === o.colId) return

    const fromCol = d.columns.find((c) => c.id === a.colId)
    const toCol = d.columns.find((c) => c.id === o.colId)
    const card = fromCol.cards[a.index]
    const insertAt = o.isColumn ? toCol.cards.length : o.index

    setBoard({
      ...d,
      columns: d.columns.map((c) => {
        if (c.id === fromCol.id) return { ...c, cards: c.cards.filter((cc) => cc.id !== active.id) }
        if (c.id === toCol.id) {
          const cards = [...c.cards]
          cards.splice(insertAt, 0, card)
          return { ...c, cards }
        }
        return c
      }),
    })
  }

  const onDragEnd = ({ active, over }) => {
    setActiveCard(null)
    if (!over) return
    const d = viewRef.current
    const a = locate(d, active.id)
    const o = locate(d, over.id)
    if (!a || !o) return

    let next
    if (a.colId === o.colId) {
      const col = d.columns.find((c) => c.id === a.colId)
      let newIndex = o.isColumn ? col.cards.length - 1 : o.index
      if (newIndex < 0) newIndex = 0
      const cards = arrayMove(col.cards, a.index, newIndex)
      next = { ...d, columns: d.columns.map((c) => (c.id === col.id ? { ...c, cards } : c)) }
    } else {
      const fromCol = d.columns.find((c) => c.id === a.colId)
      const toCol = d.columns.find((c) => c.id === o.colId)
      const card = fromCol.cards[a.index]
      const insertAt = o.isColumn ? toCol.cards.length : o.index
      next = {
        ...d,
        columns: d.columns.map((c) => {
          if (c.id === fromCol.id) return { ...c, cards: c.cards.filter((cc) => cc.id !== active.id) }
          if (c.id === toCol.id) {
            const cards = [...c.cards]
            cards.splice(insertAt, 0, card)
            return { ...c, cards }
          }
          return c
        }),
      }
    }

    setBoard(next)
    const finalCol = next.columns.find((c) => c.cards.some((cc) => cc.id === active.id))
    const finalIndex = finalCol.cards.findIndex((cc) => cc.id === active.id)
    api.moveCard(active.id, finalCol.id, finalIndex).catch(load)
  }

  return (
    <div className="page">
      <h1>{view?.name || 'Kanban'}</h1>
      <p className="page-subtitle">Task board. Drag cards to reorder or move between lists.</p>

      {error && <div className="card">{error}</div>}
      {!view && !error && <div className="card">Loading…</div>}

      {view && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="kanban-board">
            {view.columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                onRename={renameColumn}
                onDelete={deleteColumn}
                onAddCard={addCard}
                onEditCard={editCard}
                onDeleteCard={deleteCard}
                onOpenCard={setSelectedId}
              />
            ))}

            <div className={'kanban-add-column' + (addingColumn ? ' is-adding' : '')}>
              {addingColumn ? (
                <div className="kanban-add-card">
                  <input
                    autoFocus
                    className="kanban-column-input"
                    placeholder="List title…"
                    value={newColumn}
                    onChange={(e) => setNewColumn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addColumnSubmit()
                      if (e.key === 'Escape') {
                        setNewColumn('')
                        setAddingColumn(false)
                      }
                    }}
                  />
                  <div className="kanban-add-actions">
                    <button type="button" className="btn-primary" onClick={addColumnSubmit}>
                      Add list
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Cancel"
                      onClick={() => {
                        setNewColumn('')
                        setAddingColumn(false)
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="kanban-add-list-trigger"
                  title="Add a list"
                  aria-label="Add a list"
                  onClick={() => setAddingColumn(true)}
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeCard ? (
              <div
                className="kanban-card is-overlay"
                style={activeWidth ? { width: activeWidth } : undefined}
              >
                <div className="kanban-card-top">
                  <span className="kanban-card-title">{activeCard.title}</span>
                </div>
                <CardMeta card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {selectedCard && (
        <CardDetailPanel
          card={selectedCard}
          onClose={() => setSelectedId(null)}
          onSave={editCard}
          onDelete={deleteCardFromPanel}
        />
      )}
    </div>
  )
}
