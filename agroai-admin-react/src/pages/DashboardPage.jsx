import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUsers, getDeviceRequests, getPredictions } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'
import Topbar from '../components/Topbar.jsx'
import StatCard from '../components/StatCard.jsx'
import Badge from '../components/Badge.jsx'
import { Button, Card, CardHeader, UserCell, ConfBar, EmptyState } from '../components/UI.jsx'
import Spinner from '../components/Spinner.jsx'
import './DashboardPage.css'

function timeAgo(date) {
  if (!date) return '—'
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function DashboardPage() {
  const toast = useToast()
  const [users, setUsers]     = useState([])
  const [requests, setRequests] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([getUsers(), getDeviceRequests()])
      setUsers(u)
      setRequests(r)
      try { const p = await getPredictions(); setPredictions(p) } catch {}
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      toast(err.message, 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const nonAdmin = users.filter(u => u.role !== 'admin')
  const allDevices = users.reduce((a, u) => a + (u.devices?.length || 0), 0)
  const pending = requests.filter(r => r.status === 'pending')
  const blocked = users.filter(u => u.isBlocked)

  return (
    <div className="page">
      <Topbar
        title="Dashboard"
        subtitle="Overview"
        actions={
          <>
            {lastUpdated && <span className="mono muted" style={{fontSize:11}}>Updated {lastUpdated}</span>}
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>↻ Refresh</Button>
          </>
        }
      />

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Total Users" value={loading ? '…' : nonAdmin.length} sub={`${blocked.length} blocked`} icon="👤" color="accent" />
          <StatCard label="Registered Devices" value={loading ? '…' : allDevices} sub="across all users" icon="📡" color="info" />
          <StatCard label="Pending Requests" value={loading ? '…' : pending.length} sub={`${requests.filter(r=>r.status==='approved').length} approved total`} icon="📋" color="warning" />
          <StatCard label="Predictions" value={loading ? '…' : predictions.length} sub="total detections" icon="🔬" color="danger" />
        </div>

        <div className="dash-grid">
          {/* Recent Users */}
          <Card>
            <CardHeader title="Recent Users" meta={`${nonAdmin.length} registered`}>
              <Link to="/users"><Button variant="ghost" size="sm">View all →</Button></Link>
            </CardHeader>
            <div className="table-wrap">
              <table>
                <thead><tr><th>User</th><th>Role</th><th>Devices</th><th>Status</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="loading-cell"><Spinner /></td></tr>
                  ) : users.slice(0, 6).map(u => (
                    <tr key={u._id}>
                      <td><UserCell firstName={u.firstName} lastName={u.lastName} email={u.email} /></td>
                      <td><Badge status={u.role} /></td>
                      <td className="mono">{u.devices?.length || 0}</td>
                      <td><Badge status={u.isBlocked ? 'blocked' : 'active'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pending Requests */}
          <Card>
            <CardHeader title="Pending Device Requests" meta={`${pending.length} need action`}>
              <Link to="/device-requests"><Button variant="ghost" size="sm">View all →</Button></Link>
            </CardHeader>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Applicant</th><th>Contact</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="loading-cell"><Spinner /></td></tr>
                  ) : pending.length === 0 ? (
                    <tr><td colSpan={4}><EmptyState icon="✓" text="No pending requests" /></td></tr>
                  ) : pending.slice(0, 5).map(r => (
                    <tr key={r._id}>
                      <td>
                        <div className="user-name">{r.username}</div>
                        <div className="user-email">{r.userEmail}</div>
                      </td>
                      <td className="mono" style={{fontSize:12}}>{r.phoneNumber}</td>
                      <td><Badge status={r.status} /></td>
                      <td className="muted" style={{fontSize:12}}>{timeAgo(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Predictions */}
          <Card>
            <CardHeader title="Recent Predictions" meta="Latest disease detections">
              <Link to="/predictions"><Button variant="ghost" size="sm">View all →</Button></Link>
            </CardHeader>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Disease</th><th>Confidence</th><th>Time</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="loading-cell"><Spinner /></td></tr>
                  ) : predictions.length === 0 ? (
                    <tr><td colSpan={3}><EmptyState icon="🔬" text="No predictions yet" /></td></tr>
                  ) : predictions.slice(0, 5).map(p => (
                    <tr key={p._id}>
                      <td className="user-name">{p.diseaseName}</td>
                      <td><ConfBar value={p.confidence} /></td>
                      <td className="muted" style={{fontSize:12}}>{timeAgo(p.predictedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader title="System Overview" meta="Platform summary" />
            <div className="card-body">
              {[
                ['Total Users', nonAdmin.length + ' users'],
                ['Blocked Accounts', blocked.length + ' accounts'],
                ['Device Requests', requests.length + ' total'],
                ['Approved Devices', requests.filter(r=>r.status==='approved').length + ' devices'],
                ['Total Predictions', predictions.length + ' detections'],
              ].map(([key, val]) => (
                <div className="detail-item" key={key}>
                  <span className="detail-key">{key}</span>
                  <span className="detail-val">{loading ? '…' : val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
