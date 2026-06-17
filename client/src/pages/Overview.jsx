import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

export default function Overview() {
  const [status, setStatus] = useState('checking…')

  // Smoke-test the API connection so the scaffold visibly proves end-to-end
  // wiring (client → Vite proxy → Express).
  useEffect(() => {
    api
      .health()
      .then((r) => setStatus(r.status === 'ok' ? 'connected' : 'unexpected response'))
      .catch(() => setStatus('not reachable'))
  }, [])

  return (
    <div className="page">
      <h1>Overview</h1>
      <p className="page-subtitle">
        Dashboard home. Summary metrics across sources will live here.
      </p>
      <div className="card">
        <span className="card-label">API connection</span>
        <span className={'status-pill status-' + status.replace(/[^a-z]/g, '')}>
          {status}
        </span>
      </div>
    </div>
  )
}
