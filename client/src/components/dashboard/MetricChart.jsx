import { X } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

// A single chart card for the right-hand graph panel. `data` is
// [{ month: 'YYYY-MM', value, ... }]; `formatValue` formats axis/tooltip.
export default function MetricChart({ title, subtitle, data, formatValue, onClose }) {
  const hasData = data && data.some((d) => d.value != null)

  return (
    <div className="graph-card">
      <div className="graph-card-head">
        <div>
          <div className="graph-card-title">{title}</div>
          {subtitle && <div className="muted graph-card-sub">{subtitle}</div>}
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close chart">
          <X size={16} />
        </button>
      </div>

      {!hasData ? (
        <div className="muted graph-card-empty">No data to chart.</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              stroke="var(--border)"
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              stroke="var(--border)"
              width={52}
              tickFormatter={formatValue}
            />
            <Tooltip
              formatter={(v) => [formatValue(v), title]}
              contentStyle={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
              }}
              labelStyle={{ color: 'var(--text-muted)' }}
              cursor={{ stroke: 'var(--border)' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
