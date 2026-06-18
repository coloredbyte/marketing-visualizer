import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, Table, Settings as SettingsIcon } from 'lucide-react'
import Layout from './layout/Layout.jsx'
import Overview from './pages/Overview.jsx'
import TablePreview from './pages/TablePreview.jsx'
import Kanban from './pages/Kanban.jsx'
import Settings from './pages/Settings.jsx'
import { BOARDS } from './boards.js'

// Top-level sidebar items.
export const navItems = [
  { path: '/', label: 'Overview', end: true, icon: LayoutDashboard },
  { path: '/table-preview', label: 'Table preview', icon: Table },
]

// Pinned to the bottom of the sidebar.
export const bottomNavItems = [
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/table-preview" element={<TablePreview />} />
        <Route path="/kanban/:boardId" element={<Kanban />} />
        {/* Bare /kanban → first board */}
        <Route
          path="/kanban"
          element={<Navigate to={`/kanban/${BOARDS[0].id}`} replace />}
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
