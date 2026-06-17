import { NavLink } from 'react-router-dom'
import { navItems } from '../App.jsx'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Marketing Visualizer</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              'sidebar-link' + (isActive ? ' is-active' : '')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
