import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { formatDate, todayISO } from '../../cardFields.js'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const pad = (n) => String(n).padStart(2, '0')
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

function parseISO(v) {
  if (!v) return null
  const [y, m, d] = v.split('-').map(Number)
  if (!y || !m || !d) return null
  return { y, m: m - 1, d }
}

// Lightweight, themed date picker. Stores/returns YYYY-MM-DD. No dependencies
// beyond the icons we already use.
export default function DatePicker({ value, onChange, placeholder = 'Pick a date' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = parseISO(value)
  const start = selected || parseISO(todayISO())
  const [view, setView] = useState({ y: start.y, m: start.m })

  // Sync the visible month to the selection (or today) each time it opens.
  useEffect(() => {
    if (!open) return
    const p = parseISO(value) || parseISO(todayISO())
    setView({ y: p.y, m: p.m })
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (d) => {
    onChange(toISO(view.y, view.m, d))
    setOpen(false)
  }
  const prevMonth = () =>
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))
  const nextMonth = () =>
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))

  const firstWeekday = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const today = parseISO(todayISO())

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isSelected = (d) =>
    selected && selected.y === view.y && selected.m === view.m && selected.d === d
  const isToday = (d) =>
    today.y === view.y && today.m === view.m && today.d === d

  return (
    <div className="datepicker" ref={ref}>
      <button
        type="button"
        className={'datepicker-trigger' + (value ? '' : ' is-empty')}
        onClick={() => setOpen((o) => !o)}
      >
        <CalendarDays size={15} />
        <span>{value ? formatDate(value) : placeholder}</span>
      </button>

      {open && (
        <div className="datepicker-pop">
          <div className="datepicker-head">
            <button type="button" className="icon-btn" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <span className="datepicker-month">
              {MONTHS[view.m]} {view.y}
            </span>
            <button type="button" className="icon-btn" onClick={nextMonth} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="datepicker-grid datepicker-weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w} className="datepicker-wd">
                {w}
              </span>
            ))}
          </div>

          <div className="datepicker-grid">
            {cells.map((d, i) =>
              d === null ? (
                <span key={`e${i}`} />
              ) : (
                <button
                  key={d}
                  type="button"
                  className={
                    'datepicker-day' +
                    (isSelected(d) ? ' is-selected' : '') +
                    (isToday(d) ? ' is-today' : '')
                  }
                  onClick={() => pick(d)}
                >
                  {d}
                </button>
              ),
            )}
          </div>

          <div className="datepicker-foot">
            <button
              type="button"
              className="datepicker-link"
              onClick={() => {
                onChange(todayISO())
                setOpen(false)
              }}
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                className="datepicker-link"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
