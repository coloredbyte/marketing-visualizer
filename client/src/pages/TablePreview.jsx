import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

// Render an Airtable cell value (string, number, array, or object like a
// linked record / attachment) as readable text.
function fmt(v) {
  if (v == null) return ''
  if (Array.isArray(v)) {
    return v.map((x) => (x && typeof x === 'object' ? x.name || x.filename || '' : x)).join(', ')
  }
  if (typeof v === 'object') return v.name || JSON.stringify(v)
  return String(v)
}

export default function TablePreview() {
  const [config, setConfig] = useState(null)
  const [baseId, setBaseId] = useState('')
  const [tables, setTables] = useState(null)
  const [tableName, setTableName] = useState('')
  const [records, setRecords] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getAirtableConfig().then(setConfig).catch(() => setConfig({ connected: false }))
  }, [])

  useEffect(() => {
    if (config?.connected && config.bases?.length) setBaseId(config.bases[0].baseId)
  }, [config])

  useEffect(() => {
    if (!baseId) return
    setError('')
    setTables(null)
    setTableName('')
    setRecords(null)
    api
      .getAirtableTables(baseId)
      .then((ts) => {
        setTables(ts)
        if (ts.length) setTableName(ts[0].name)
      })
      .catch((e) => setError(e.message))
  }, [baseId])

  useEffect(() => {
    if (!baseId || !tableName) return
    setLoading(true)
    setError('')
    setRecords(null)
    api
      .getAirtableRecords(baseId, tableName, 25)
      .then(setRecords)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [baseId, tableName])

  if (!config) {
    return (
      <div className="page">
        <h1>Table preview</h1>
        <div className="card">Loading…</div>
      </div>
    )
  }

  if (!config.connected) {
    return (
      <div className="page">
        <h1>Table preview</h1>
        <p className="page-subtitle">Browse your Airtable data.</p>
        <div className="card">
          <span>Airtable isn’t connected yet.</span>
          <Link to="/settings" className="btn-primary" style={{ textDecoration: 'none' }}>
            Connect in Settings
          </Link>
        </div>
      </div>
    )
  }

  const current = tables?.find((t) => t.name === tableName)

  return (
    <div className="page">
      <h1>Table preview</h1>
      <p className="page-subtitle">
        Browse your Airtable data, then tell me what to aggregate for the dashboard.
      </p>

      {error && <div className="card">{error}</div>}

      <div className="explorer-bar">
        {config.bases?.length > 1 && (
          <>
            <label>Base</label>
            <select value={baseId} onChange={(e) => setBaseId(e.target.value)}>
              {config.bases.map((b) => (
                <option key={b.id} value={b.baseId}>
                  {b.label || b.baseId}
                </option>
              ))}
            </select>
          </>
        )}
        {tables && (
          <>
            <label>Table</label>
            <select value={tableName} onChange={(e) => setTableName(e.target.value)}>
              {tables.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {current && (
        <div className="explorer-fields">
          {current.fields.map((f) => (
            <span key={f.id} className="field-chip">
              {f.name} <em>{f.type}</em>
            </span>
          ))}
        </div>
      )}

      {loading && <div className="card">Loading records…</div>}

      {records && current && (
        <>
          <div className="explorer-table-wrap">
            <table className="explorer-table">
              <thead>
                <tr>
                  {current.fields.map((f) => (
                    <th key={f.id}>{f.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    {current.fields.map((f) => (
                      <td key={f.id}>{fmt(r[f.name])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="done-count">{records.length} records (preview)</div>
        </>
      )}
    </div>
  )
}
