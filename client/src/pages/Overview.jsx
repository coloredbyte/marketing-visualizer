import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { DASHBOARD, isConfigured } from '../dashboardConfig.js'
import { formatAmount, cardFee } from '../cardFields.js'
import { BOARDS } from '../boards.js'
import DateRangeFilter from '../components/dashboard/DateRangeFilter.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import MetricChart from '../components/dashboard/MetricChart.jsx'

// Single-select comes back as a string; guard the other shapes just in case.
function cellName(v) {
  if (v == null || v === '') return 'Unassigned'
  if (Array.isArray(v)) return v.map((x) => (x && typeof x === 'object' ? x.name : x)).join(', ')
  if (typeof v === 'object') return v.name || 'Unassigned'
  return String(v)
}
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const fmtRate = (calls, proposals) => (proposals > 0 ? `${((calls / proposals) * 100).toFixed(1)}%` : '—')

function inRange(dateValue, from, to) {
  if (!dateValue) return false
  const d = String(dateValue).slice(0, 10)
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

const ym = (dateValue) => String(dateValue || '').slice(0, 7) // YYYY-MM

// Inclusive calendar-month count spanned by the range; unbounded ranges = 1.
function monthsInRange(from, to) {
  if (!from || !to) return 1
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  return Math.max(1, ty * 12 + tm - (fy * 12 + fm) + 1)
}

// Month-to-date; matches the "This month" preset so that chip shows active.
function monthToDate() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return { from: `${d.getFullYear()}-${m}-01`, to: `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, '0')}` }
}

export default function Overview() {
  const [config, setConfig] = useState(null)
  const [records, setRecords] = useState(null)
  const [error, setError] = useState('')
  const [range, setRange] = useState(() => monthToDate())
  const [sel, setSel] = useState(DASHBOARD.dimension.options[0].label)
  // Upwork kanban cards (both boards) annotated with their computed fee.
  const [kanbanCards, setKanbanCards] = useState(null)
  const [fixedCosts, setFixedCosts] = useState(null) // { boardId: monthly fixed cost }
  const [charts, setCharts] = useState([]) // active chart keys in the right panel
  const toggleChart = (key) =>
    setCharts((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  useEffect(() => {
    api.getAirtableConfig().then(setConfig).catch(() => setConfig({ connected: false }))
  }, [])

  // Pull every card (active + done) from both boards plus each board's fees,
  // and precompute each card's fee (fee % doesn't depend on the date range).
  useEffect(() => {
    Promise.all(
      BOARDS.map(async (b) => {
        const [board, done, fees] = await Promise.all([
          api.getBoard(b.id),
          api.getDone(b.id),
          api.getFees(b.id),
        ])
        const cards = [...board.columns.flatMap((c) => c.cards), ...done].map((card) => ({
          board: b.id,
          tag: card.tag,
          startedDate: card.startedDate || '',
          finishedDate: card.finishedDate || '',
          fee: cardFee(card, fees),
        }))
        return { boardId: b.id, cards, fixed: Number(fees.upworkFixed) || 0 }
      }),
    )
      .then((results) => {
        setKanbanCards(results.flatMap((r) => r.cards))
        setFixedCosts(Object.fromEntries(results.map((r) => [r.boardId, r.fixed])))
      })
      .catch(() => {
        setKanbanCards([])
        setFixedCosts({})
      })
  }, [])

  useEffect(() => {
    if (!config?.connected || !isConfigured()) return
    const base = config.bases?.find((b) => b.label === DASHBOARD.baseLabel)
    if (!base) {
      setError(`Base “${DASHBOARD.baseLabel}” isn’t connected — check Settings.`)
      return
    }
    setError('')
    setRecords(null)
    api
      .getAirtableRecords(base.baseId, DASHBOARD.table, 5000)
      .then(setRecords)
      .catch((e) => setError(e.message))
  }, [config])

  const options = DASHBOARD.dimension.options

  const metrics = useMemo(() => {
    if (!records || !sel) return null
    const opt = options.find((o) => o.label === sel)
    const allowed = new Set(opt?.values || [])
    let proposals = 0
    let replies = 0
    let calls = 0
    let cost = 0
    for (const r of records) {
      if (!allowed.has(cellName(r[DASHBOARD.dimension.field]))) continue
      if (!inRange(r[DASHBOARD.dateField], range.from, range.to)) continue
      proposals += num(r[DASHBOARD.proposalsField])
      replies += num(r[DASHBOARD.repliesField])
      calls += num(r[DASHBOARD.bookedCallsField])
      cost += num(r[DASHBOARD.costField])
    }
    return { proposals, replies, calls, cost }
  }, [records, range, sel, options])

  // Upwork proposal cost: sum of fees on Upwork cards that are still active
  // (no Finished date) or finished within the selected range.
  const proposalCost = useMemo(() => {
    if (!kanbanCards) return null
    const opt = options.find((o) => o.label === sel)
    const boards = new Set(opt?.boards || [])
    let sum = 0
    for (const c of kanbanCards) {
      if (!boards.has(c.board)) continue
      if (c.tag !== 'upwork') continue
      if (c.finishedDate && !inRange(c.finishedDate, range.from, range.to)) continue
      sum += c.fee
    }
    return sum
  }, [kanbanCards, range, sel, options])

  // Upwork fixed cost: each selected board's monthly fixed cost × months in range.
  const fixedCost = useMemo(() => {
    if (!fixedCosts) return null
    const opt = options.find((o) => o.label === sel)
    const months = monthsInRange(range.from, range.to)
    return (opt?.boards || []).reduce((sum, b) => sum + (fixedCosts[b] || 0) * months, 0)
  }, [fixedCosts, range, sel, options])

  // Monthly cost-per-call series for the chart (full history, ignores the date
  // range; respects the Service selection). Airtable cost+calls bucket by Date,
  // kanban fees by Started date, monthly fixed cost added to each month present.
  const costPerCallSeries = useMemo(() => {
    if (!records || !kanbanCards || !fixedCosts) return null
    const opt = options.find((o) => o.label === sel)
    const serviceVals = new Set(opt?.values || [])
    const boards = new Set(opt?.boards || [])
    const monthlyFixed = [...boards].reduce((s, b) => s + (fixedCosts[b] || 0), 0)

    const byMonth = {}
    const bucket = (m) => (byMonth[m] ||= { cost: 0, calls: 0 })

    for (const r of records) {
      if (!serviceVals.has(cellName(r[DASHBOARD.dimension.field]))) continue
      const m = ym(r[DASHBOARD.dateField])
      if (!m) continue
      const slot = bucket(m)
      slot.cost += num(r[DASHBOARD.costField])
      slot.calls += num(r[DASHBOARD.bookedCallsField])
    }
    for (const c of kanbanCards) {
      if (!boards.has(c.board) || c.tag !== 'upwork') continue
      const m = ym(c.startedDate)
      if (!m) continue
      bucket(m).cost += c.fee
    }

    return Object.keys(byMonth)
      .sort()
      .map((m) => {
        const s = byMonth[m]
        const total = s.cost + monthlyFixed
        return { month: m, value: s.calls > 0 ? total / s.calls : null, calls: s.calls }
      })
  }, [records, kanbanCards, fixedCosts, sel, options])

  if (!config) {
    return (
      <div className="page">
        <h1>Overview</h1>
        <div className="card">Loading…</div>
      </div>
    )
  }

  if (!config.connected) {
    return (
      <div className="page">
        <h1>Overview</h1>
        <p className="page-subtitle">Leads &amp; sales dashboard.</p>
        <div className="card">
          <span>Connect Airtable to power the dashboard.</span>
          <Link to="/settings" className="btn-primary" style={{ textDecoration: 'none' }}>
            Connect in Settings
          </Link>
        </div>
      </div>
    )
  }

  const m = metrics
  // Total Upwork cost = VA cost (Airtable) + proposal fees + fixed cost.
  const totalCost = m ? m.cost + (proposalCost || 0) + (fixedCost || 0) : null
  const costPerCall = m && totalCost != null && m.calls > 0 ? totalCost / m.calls : null

  // Registry of chartable metrics (their monthly series).
  const chartDefs = {
    costPerCall: {
      title: 'Cost per call',
      subtitle: `${sel} · monthly`,
      data: costPerCallSeries || [],
      formatValue: (v) => formatAmount(v),
    },
  }

  return (
    <div className="page">
      <div className="dashboard-layout">
        <div className="dashboard-main">
          <DateRangeFilter value={range} onChange={setRange} />

          <div className="va-filter">
            <label>{DASHBOARD.dimension.label}</label>
            <select value={sel} onChange={(e) => setSel(e.target.value)}>
              {options.map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="card">{error}</div>}
          {!error && !m && <div className="card">Loading data…</div>}

          <div className="bento">
            <StatCard label="Proposals sent" value={m ? m.proposals.toLocaleString() : '—'} />
            <StatCard label="Replies" value={m ? m.replies.toLocaleString() : '—'} />
            <StatCard label="Reply rate" value={m ? fmtRate(m.replies, m.proposals) : '—'} />
            <StatCard label="Calls booked" value={m ? m.calls.toLocaleString() : '—'} />
            <StatCard label="Booked-call rate" value={m ? fmtRate(m.calls, m.proposals) : '—'} />

            <div className="bento-break" />
            <StatCard label="Upwork cost" value={m ? formatAmount(m.cost) : '—'} />
            <StatCard
              label="Proposal cost"
              value={proposalCost != null ? formatAmount(proposalCost) : '—'}
            />
            <StatCard
              label="UW fixed cost"
              value={fixedCost != null ? formatAmount(fixedCost) : '—'}
            />
            <StatCard
              label="Total Upwork cost"
              value={totalCost != null ? formatAmount(totalCost) : '—'}
            />
            <StatCard
              label="Cost per call"
              value={costPerCall != null ? formatAmount(costPerCall) : '—'}
              tone="green"
              onGraph={() => toggleChart('costPerCall')}
              graphActive={charts.includes('costPerCall')}
            />
          </div>
        </div>

        {charts.length > 0 && (
          <aside className="dashboard-graphs">
            {charts.map((key) => {
              const def = chartDefs[key]
              return def ? (
                <MetricChart key={key} {...def} onClose={() => toggleChart(key)} />
              ) : null
            })}
          </aside>
        )}
      </div>
    </div>
  )
}

function rangeLabel(range) {
  if (!range.from && !range.to) return 'All time'
  return `${range.from || '…'} → ${range.to || '…'}`
}
