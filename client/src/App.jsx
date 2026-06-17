import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layout/Layout.jsx'
import Overview from './pages/Overview.jsx'
import Kanban from './pages/Kanban.jsx'
import Settings from './pages/Settings.jsx'

// Sidebar nav items. Adding a page is a two-line change: add an entry here and
// a matching <Route> below.
export const navItems = [
  { path: '/', label: 'Overview', end: true },
  { path: '/kanban', label: 'Kanban' },
  { path: '/settings', label: 'Settings' },
]

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
