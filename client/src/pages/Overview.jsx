import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

export default function Overview() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    api.getAirtableConfig().then(setConfig).catch(() => setConfig({ connected: false }))
  }, [])

  return (
    <div className="page">
      <h1>Overview</h1>
      <p className="page-subtitle">Leads &amp; sales dashboard.</p>

      {config && !config.connected ? (
        <div className="card">
          <span>Connect Airtable to power the dashboard.</span>
          <Link to="/settings" className="btn-primary" style={{ textDecoration: 'none' }}>
            Connect in Settings
          </Link>
        </div>
      ) : (
        <div className="card">
          <span className="muted">
            Charts are coming next — explore your data in{' '}
            <Link to="/table-preview">Table preview</Link> and tell me what to aggregate.
          </span>
        </div>
      )}
    </div>
  )
}
