import DatePicker from '../kanban/DatePicker.jsx'

const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toISO(d)
}
function startOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function startOfYear() {
  return `${new Date().getFullYear()}-01-01`
}

// Built lazily so "today" is correct at click time.
const PRESETS = [
  { label: 'This month', range: () => ({ from: startOfMonth(), to: toISO(new Date()) }) },
  { label: 'Last 30 days', range: () => ({ from: daysAgo(30), to: toISO(new Date()) }) },
  { label: 'Last 90 days', range: () => ({ from: daysAgo(90), to: toISO(new Date()) }) },
  { label: 'Year to date', range: () => ({ from: startOfYear(), to: toISO(new Date()) }) },
  { label: 'All time', range: () => ({ from: '', to: '' }) },
]

export default function DateRangeFilter({ value, onChange }) {
  const matches = (p) => {
    const r = p.range()
    return r.from === value.from && r.to === value.to
  }

  return (
    <div className="daterange">
      <div className="daterange-presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={'filter-chip' + (matches(p) ? ' is-on' : '')}
            onClick={() => onChange(p.range())}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="daterange-custom">
        <DatePicker
          value={value.from}
          onChange={(from) => onChange({ ...value, from })}
          placeholder="From"
        />
        <span>–</span>
        <DatePicker
          value={value.to}
          onChange={(to) => onChange({ ...value, to })}
          placeholder="To"
          align="right"
        />
      </div>
    </div>
  )
}
