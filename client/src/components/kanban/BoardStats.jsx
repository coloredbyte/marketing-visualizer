import { cardFee, formatAmount } from '../../cardFields.js'

// Per-board mini dashboard. For each platform, totals the active projects
// (cards with no Finished date), the money on the platform, and the summed
// per-card fees (your spend). Buyer and seller cards are combined.
export default function BoardStats({ view, fees, children }) {
  const active = view.columns.flatMap((c) => c.cards).filter((c) => !c.finishedDate)

  const platforms = [
    { key: 'upwork', label: 'Upwork' },
    { key: 'fiverr', label: 'Fiverr' },
  ]

  const stats = platforms.map((p) => {
    const set = active.filter((c) => c.tag === p.key)
    const money = set.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
    const feeTotal = set.reduce((sum, c) => sum + cardFee(c, fees), 0)
    return { ...p, count: set.length, money, feeTotal }
  })

  return (
    <div className="board-stats">
      {stats.map((s) => (
        <div key={s.key} className={'stat-panel stat-' + s.key}>
          <div className="stat-panel-head">
            <span className="stat-platform">{s.label}</span>
          </div>
          <div className="stat-metrics">
            <div className="stat">
              <span className="stat-value">{s.count}</span>
              <span className="stat-label">Active projects</span>
            </div>
            <div className="stat">
              <span className="stat-value">{formatAmount(s.money)}</span>
              <span className="stat-label">On platform</span>
            </div>
            <div className="stat">
              <span className="stat-value">{formatAmount(s.feeTotal)}</span>
              <span className="stat-label">Fees (spend)</span>
            </div>
          </div>
        </div>
      ))}
      {children}
    </div>
  )
}
