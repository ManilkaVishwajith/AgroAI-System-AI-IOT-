import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import './Layout.css'

export default function Layout() {
  return (
    <div className="shell">
      <div className="shell-ambient-glow" />
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}