import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

// Step 1: read-only render of the stubbed board from the API. Drag-and-drop and
// CRUD come in step 2.
export default function Kanban() {
  const [board, setBoard] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getBoard().then(setBoard).catch(() => setError('Could not load board'))
  }, [])

  return (
    <div className="page">
      <h1>Kanban</h1>
      <p className="page-subtitle">
        Task board. Persisted as JSON now, Neon Postgres later.
      </p>

      {error && <div className="card">{error}</div>}

      {!board && !error && <div className="card">Loading…</div>}

      {board && (
        <div className="kanban-board">
          {board.columns.map((col) => (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-title">{col.title}</div>
              {col.cards.map((card) => (
                <div key={card.id} className="kanban-card">
                  {card.title}
                </div>
              ))}
              {col.cards.length === 0 && (
                <div className="kanban-empty">No cards</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
