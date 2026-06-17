import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { navItems, bottomNavItems } from '../App.jsx'
import { BOARDS } from '../boards.js'
import Logo from './Logo.jsx'

const STORAGE_KEY = 'mv:sidebar-collapsed'

function NavItem({ item, collapsed }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) => 'sidebar-link' + (isActive ? ' is-active' : '')}
    >
      <Icon className="sidebar-icon" size={20} strokeWidth={1.75} />
      <span className="sidebar-label">{item.label}</span>
    </NavLink>
  )
}

function BoardItem({ board, collapsed }) {
  return (
    <NavLink
      to={`/kanban/${board.id}`}
      title={collapsed ? board.name : undefined}
      className={({ isActive }) => 'sidebar-link' + (isActive ? ' is-active' : '')}
    >
      <span className="sidebar-avatar">{board.initial}</span>
      <span className="sidebar-label">{board.name}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  // Persist open/closed state across reloads.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1',
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <aside className={'sidebar' + (collapsed ? ' is-collapsed' : '')}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft size={16} strokeWidth={2.25} />
      </button>

      <div className="sidebar-header">
        <Logo collapsed={collapsed} />
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}

        <div className="sidebar-section-label">Kanban</div>
        {BOARDS.map((board) => (
          <BoardItem key={board.id} board={board} collapsed={collapsed} />
        ))}
      </nav>

      <nav className="sidebar-nav sidebar-nav-bottom">
        {bottomNavItems.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  )
}
