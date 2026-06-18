import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, X, Trash2 } from 'lucide-react'
import { api } from '../api/client.js'
import { DEFAULT_TAG, todayISO } from '../cardFields.js'
import Column from '../components/kanban/Column.jsx'
import CardMeta from '../components/kanban/CardMeta.jsx'
import BoardStats from '../components/kanban/BoardStats.jsx'
import CardDetailPanel from '../components/kanban/CardDetailPanel.jsx'
import ConfirmDialog from '../components/kanban/ConfirmDialog.jsx'
import CompletedDropZone, { DROPZONE_ID } from '../components/kanban/CompletedDropZone.jsx'
import DoneProjects from '../components/kanban/DoneProjects.jsx'

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
  const [confirm, setConfirm] = useState(null) // { title, message, confirmLabel, onConfirm }
  const [fees, setFees] = useState(null)
  const [done, setDone] = useState(null)
  const [tab, setTab] = useState('exchanges') // 'exchanges' | 'done'
  const [zonePulse, setZonePulse] = useState(false)
  // Whether the last drop landed on the complete zone — read by the drop
  // animation so the overlay shrinks/fades instead of springing back.
  const lastDropOnZone = useRef(false)

  // The currently-open card, derived fresh each render (from the active board
  // or the done list) so the panel reflects saved edits.
  const selectedCard =
    (view ? view.columns.flatMap((c) => c.cards).find((c) => c.id === selectedId) : null) ||
    (done ? done.find((c) => c.id === selectedId) : null) ||
    null

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

  // Prefer the complete zone whenever the pointer is over it; otherwise use
  // closestCorners so column sorting stays smooth.
  const collisionDetection = useCallback((args) => {
    const zone = pointerWithin(args).find((c) => c.id === DROPZONE_ID)
    return zone ? [zone] : closestCorners(args)
  }, [])

  // When dropped on the complete zone, the card is "sucked in" (shrink + fade
  // at the drop point); otherwise it springs back to its slot as usual.
  const dropAnimation = {
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
    keyframes({ transform }) {
      if (lastDropOnZone.current) {
        const base = `translate3d(${transform.initial.x}px, ${transform.initial.y}px, 0)`
        return [
          { transform: `${base} scale(1)`, opacity: 1 },
          { transform: `${base} scale(0.2)`, opacity: 0 },
        ]
      }
      return [
        { transform: CSS.Transform.toString(transform.initial), opacity: 1 },
        { transform: CSS.Transform.toString(transform.final), opacity: 1 },
      ]
    },
  }

  const load = useCallback(() => {
    setError(null)
    api
      .getBoard(boardId)
      .then(setBoard)
      .catch(() => setError('Could not load board'))
  }, [boardId, setBoard])

  const loadDone = useCallback(() => {
    api.getDone(boardId).then(setDone).catch(() => setDone([]))
  }, [boardId])

  // Reload both the active board and the done list after a mutation that can
  // move cards between them (complete, restore, edits, deletes).
  const refresh = useCallback(() => {
    load()
    loadDone()
  }, [load, loadDone])

  useEffect(() => {
    setBoard(null)
    setDone(null)
    setSelectedId(null)
    setTab('exchanges')
    load()
    loadDone()
  }, [load, loadDone, setBoard])

  // Platform fees for the mini dashboard (set in Settings).
  useEffect(() => {
    api.getFees(boardId).then(setFees).catch(() => setFees(null))
  }, [boardId])

  // ---- CRUD (reload after each mutation to stay in sync) ----
  const addColumnSubmit = () => {
    const title = newColumn.trim()
    setNewColumn('')
    setAddingColumn(false)
    if (title) api.addColumn(boardId, title).then(load).catch(load)
  }
  const renameColumn = (id, title) => api.updateColumn(id, { title }).then(load).catch(load)
  const addCard = (columnId, title) =>
    api
      .addCard(columnId, { title, tag: DEFAULT_TAG, startedDate: todayISO() })
      .then(load)
      .catch(load)
  const editCard = (id, fields) => api.updateCard(id, fields).then(refresh).catch(refresh)

  // Mark a card complete (sets Finished date = today → moves to Done Projects).
  const completeCard = (id) =>
    api.updateCard(id, { finishedDate: todayISO() }).then(refresh).catch(refresh)
  // Send a done card back to its board column.
  const restoreCard = (id) => api.restoreCard(id).then(refresh).catch(refresh)

  // ---- Deletes (always confirmed via dialog) ----
  const findCard = (id) =>
    viewRef.current?.columns.flatMap((c) => c.cards).find((c) => c.id === id)

  const requestDeleteCard = (id) => {
    const card = findCard(id)
    setConfirm({
      title: 'Delete card',
      message: `“${card?.title || 'This card'}” will be permanently deleted.`,
      confirmLabel: 'Delete card',
      onConfirm: () => {
        setConfirm(null)
        if (selectedId === id) setSelectedId(null)
        api.deleteCard(id).then(refresh).catch(refresh)
      },
    })
  }

  const requestDeleteColumn = (id) => {
    const col = viewRef.current?.columns.find((c) => c.id === id)
    const n = col?.cards.length || 0
    const cardNote = n ? ` and its ${n} card${n > 1 ? 's' : ''}` : ''
    setConfirm({
      title: 'Delete list',
      message: `“${col?.title || 'This list'}”${cardNote} will be permanently deleted.`,
      confirmLabel: 'Delete list',
      onConfirm: () => {
        setConfirm(null)
        api.deleteColumn(id).then(refresh).catch(refresh)
      },
    })
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
    lastDropOnZone.current = over?.id === DROPZONE_ID
    setActiveCard(null)
    if (!over) return
    // Dropped on the "complete" zone → finish the card.
    if (over.id === DROPZONE_ID) {
      setZonePulse(true)
      setTimeout(() => setZonePulse(false), 450)
      completeCard(active.id)
      return
    }
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
      <p className="page-subtitle">Manage active exchanges and completed projects.</p>

      <div className="board-tabs">
        <button
          type="button"
          className={'board-tab' + (tab === 'exchanges' ? ' is-active' : '')}
          onClick={() => setTab('exchanges')}
        >
          Exchanges
        </button>
        <button
          type="button"
          className={'board-tab' + (tab === 'done' ? ' is-active' : '')}
          onClick={() => setTab('done')}
        >
          Done Projects
          {done?.length ? <span className="board-tab-count">{done.length}</span> : null}
        </button>
      </div>

      {error && <div className="card">{error}</div>}
      {!view && !error && <div className="card">Loading…</div>}

      {tab === 'done' && (
        <DoneProjects done={done} onOpen={setSelectedId} onRestore={restoreCard} />
      )}

      {tab === 'exchanges' && view && (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <BoardStats view={view} fees={fees}>
            <CompletedDropZone receiving={zonePulse} />
          </BoardStats>

          <div className="kanban-board">
            {view.columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                onRename={renameColumn}
                onDelete={requestDeleteColumn}
                onAddCard={addCard}
                onEditCard={editCard}
                onDeleteCard={requestDeleteCard}
                onOpenCard={setSelectedId}
                fees={fees}
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

          <DragOverlay dropAnimation={dropAnimation}>
            {activeCard ? (
              <div
                className="kanban-card is-overlay"
                style={activeWidth ? { width: activeWidth } : undefined}
              >
                <div className="kanban-card-top">
                  <span className="kanban-card-title">{activeCard.title}</span>
                  {/* Static, invisible — only here to reserve the same width as
                      the real card so the title doesn't reflow while dragging. */}
                  <button
                    type="button"
                    className="icon-btn kanban-card-delete"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <CardMeta card={activeCard} fees={fees} />
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
          onDelete={requestDeleteCard}
          fees={fees}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={() => confirm?.onConfirm?.()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
