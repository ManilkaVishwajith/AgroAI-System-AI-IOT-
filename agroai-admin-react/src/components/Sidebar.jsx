import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { FaRegUser } from "react-icons/fa6"
import { BiDevices } from "react-icons/bi"
import { MdOutlineDashboard } from "react-icons/md"
import { FaRegClipboard } from "react-icons/fa"
import { LuScanSearch } from "react-icons/lu"
import { IoChatbubblesOutline } from "react-icons/io5"
import agroAiLogo from '../assets/agroai.png'
import './Sidebar.css'

const NAV = [
  {
    group: 'Overview',
    items: [{ to: '/dashboard', icon: <MdOutlineDashboard />, label: 'Dashboard' }],
  },
  {
    group: 'Management',
    items: [
      { to: '/users', icon: <FaRegUser />, label: 'Users' },
      { to: '/devices', icon: <BiDevices />, label: 'Devices' },
      { to: '/device-requests', icon: <FaRegClipboard />, label: 'Device Requests' },
    ],
  },
  {
    group: 'Insights',
    items: [
      { to: '/predictions', icon: <LuScanSearch />, label: 'Disease Predictions' },
      { to: '/chats', icon: <IoChatbubblesOutline />, label: 'Chat Logs' },
    ],
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    if (window.confirm('Sign out of AgroAI Admin?')) {
      logout()
      navigate('/login')
    }
  }

  const initials = user
    ? (user.firstName?.[0] || '') + (user.lastName?.[0] || '')
    : 'A'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src={agroAiLogo} 
            alt="AgroAI" 
            style={{ width: "36px", height: "36px", objectFit: "contain" }} 
          />
        </div>
        <div>
          <div className="logo-name">AgroAI</div>
          <div className="logo-tag">Admin Console</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(group => (
          <div className="nav-group" key={group.group}>
            <div className="nav-group-label">{group.group}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  'nav-link' + (isActive ? ' active' : '')
                }
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="admin-chip">
          <div className="admin-ava">{initials.toUpperCase()}</div>
          <div>
            <div className="admin-name">
              {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
            </div>
            <div className="admin-status">● online</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  )
}