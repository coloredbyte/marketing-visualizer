import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { BOARDS } from '../boards.js'
import AirtableConnection from '../components/AirtableConnection.jsx'

// Per-board platform fees, split by side (buyer/seller). Used to compute each
// card's fee and reused later by the global dashboard.
export default function Settings() {
  const [fees, setFees] = useState({}) // { boardId: { upwork: {buyer,seller}, fiverr: {...} } }

  useEffect(() => {
    let alive = true
    Promise.all(BOARDS.map((b) => api.getFees(b.id).then((f) => [b.id, f])))
      .then((entries) => {
        if (alive) setFees(Object.fromEntries(entries))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const update = (boardId, platform, side, value) =>
    setFees((prev) => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        [platform]: { ...prev[boardId]?.[platform], [side]: value },
      },
    }))

  const persist = (boardId, platform, side) => {
    const v = fees[boardId]?.[platform]?.[side]
    api
      .updateFees(boardId, { [platform]: { [side]: v === '' || v == null ? 0 : Number(v) } })
      .catch(() => {})
  }

  const feeInput = (boardId, platform, side) => (
    <label className="detail-field">
      <span>{side}</span>
      <div className="input-suffixed">
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={fees[boardId]?.[platform]?.[side] ?? ''}
          onChange={(e) => update(boardId, platform, side, e.target.value)}
          onBlur={() => persist(boardId, platform, side)}
        />
        <span className="suffix">%</span>
      </div>
    </label>
  )

  const platformBlock = (boardId, platform, label) => (
    <div className="settings-platform">
      <div className="settings-platform-name">{label}</div>
      <div className="settings-fee-row">
        {feeInput(boardId, platform, 'buyer')}
        {feeInput(boardId, platform, 'seller')}
      </div>
    </div>
  )

  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="page-subtitle">Connections and platform fees.</p>

      <div className="settings-grid">
        <AirtableConnection />
      </div>

      <h2 className="settings-section-title">Platform fees</h2>
      <p className="muted settings-section-sub">
        Per board, split by side (buyer = you hiring, seller = you being hired).
        Used to calculate each card's fee.
      </p>

      <div className="settings-grid">
        {BOARDS.map((b) => (
          <div key={b.id} className="card settings-card">
            <div className="settings-card-title">
              <span className="sidebar-avatar">{b.initial}</span>
              {b.name}
            </div>
            {platformBlock(b.id, 'upwork', 'Upwork')}
            {platformBlock(b.id, 'fiverr', 'Fiverr')}
          </div>
        ))}
      </div>
    </div>
  )
}
