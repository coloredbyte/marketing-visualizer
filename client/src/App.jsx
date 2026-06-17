import { Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, KanbanSquare, Settings as SettingsIcon } from 'lucide-react'
import Layout from './layout/Layout.jsx'
import Overview from './pages/Overview.jsx'
import Kanban from './pages/Kanban.jsx'
import Settings from './pages/Settings.jsx'

// Sidebar nav items. Adding a page is a two-line change: add an entry here
// (with an icon) and a matching <Route> below.
export const navItems = [
  { path: '/', label: 'Overview', end: true, icon: LayoutDashboard },
  { path: '/kanban', label: 'Kanban', icon: KanbanSquare },
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
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
