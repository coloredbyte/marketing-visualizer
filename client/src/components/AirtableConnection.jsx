import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../api/client.js'

const BLANK_BASE = { label: '', baseId: '' }

// Connect Airtable: one token (shared) + a list of bases. The token is stored
// server-side and never returned to the browser (only a masked hint).
export default function AirtableConnection() {
  const [cfg, setCfg] = useState(null)
  const [token, setToken] = useState('')
  const [bases, setBases] = useState([{ ...BLANK_BASE }])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .getAirtableConfig()
      .then((c) => {
        setCfg(c)
        setBases(c.bases?.length ? c.bases : [{ ...BLANK_BASE }])
      })
      .catch(() => setCfg({ connected: false, bases: [] }))
  }, [])

  const setBaseField = (i, key, value) =>
    setBases((prev) => prev.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)))
  const addBase = () => setBases((prev) => [...prev, { ...BLANK_BASE }])
  const removeBase = (i) => setBases((prev) => prev.filter((_, idx) => idx !== i))

  const save = () => {
    setBusy(true)
    setStatus('')
    api
      .saveAirtableConfig({ token, bases })
      .then((c) => {
        setCfg(c)
        setBases(c.bases?.length ? c.bases : [{ ...BLANK_BASE }])
        setToken('')
        setStatus('Saved.')
      })
      .catch((e) => setStatus(e.message))
      .finally(() => setBusy(false))
  }

  const test = () => {
    const first = cfg?.bases?.[0]
    if (!first) return
    setStatus('Testing…')
    api
      .getAirtableTables(first.baseId)
      .then((ts) =>
        setStatus(`“${first.label || first.baseId}” connected — ${ts.length} table${ts.length === 1 ? '' : 's'}.`),
      )
      .catch((e) => setStatus(e.message))
  }

  return (
    <div className="card settings-card">
      <div className="settings-card-title">Airtable connection</div>
      <p className="muted">
        Create a Personal Access Token with <code>data.records:read</code> and{' '}
        <code>schema.bases:read</code>, granted access to both bases. Stored locally on the
        server — never sent to the browser.
      </p>

      <label className="detail-field">
        <span>Personal Access Token</span>
        <input
          type="password"
          autoComplete="off"
          placeholder={cfg?.hasToken ? `Saved (••••${cfg.tokenHint}) — enter to replace` : 'pat…'}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </label>

      <div className="detail-field">
        <span>Bases</span>
        <div className="airtable-bases">
          {bases.map((b, i) => (
            <div className="airtable-base-row" key={b.id || i}>
              <input
                className="base-label"
                placeholder="Label (e.g. Leads)"
                value={b.label}
                onChange={(e) => setBaseField(i, 'label', e.target.value)}
              />
              <input
                placeholder="appXXXXXXXXXXXXXX"
                value={b.baseId}
                onChange={(e) => setBaseField(i, 'baseId', e.target.value)}
              />
              <button
                type="button"
                className="icon-btn"
                aria-label="Remove base"
                onClick={() => removeBase(i)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button type="button" className="kanban-add-trigger" onClick={addBase}>
            <Plus size={16} /> Add base
          </button>
        </div>
      </div>

      <div className="settings-actions">
        <button type="button" className="btn-primary" onClick={save} disabled={busy}>
          Save
        </button>
        {cfg?.connected && (
          <button type="button" className="btn-ghost" onClick={test}>
            Test connection
          </button>
        )}
        <span className={'conn-status' + (cfg?.connected ? ' is-on' : '')}>
          {cfg ? (cfg.connected ? 'Connected' : 'Not connected') : ''}
        </span>
      </div>

      {status && <div className="muted">{status}</div>}
    </div>
  )
}
