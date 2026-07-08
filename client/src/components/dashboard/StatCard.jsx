import { LineChart } from 'lucide-react'

// A single bento-grid metric card. `size` controls how many columns it spans.
// `onGraph`, if given, shows a graph icon that opens the metric's chart.
export default function StatCard({
  label,
  value,
  hint,
  size = 'sm',
  tone,
  onGraph,
  graphActive,
  children,
}) {
  return (
    <div className={'bento-card bento-' + size + (tone ? ' is-' + tone : '')}>
      <div className="stat-card-head">
        <div className="stat-card-label">{label}</div>
        {onGraph && (
          <button
            type="button"
            className={'icon-btn stat-graph-btn' + (graphActive ? ' is-active' : '')}
            onClick={onGraph}
            title="Chart over time"
            aria-label="Chart over time"
          >
            <LineChart size={14} />
          </button>
        )}
      </div>
      {value != null && <div className="stat-card-value">{value}</div>}
      {hint && <div className="stat-card-hint">{hint}</div>}
      {children}
    </div>
  )
}
