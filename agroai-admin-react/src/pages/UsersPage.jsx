import { useState, useEffect, useMemo } from 'react'
import { getUsers, createUser, updateUser } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'
import Topbar from '../components/Topbar.jsx'
import Modal from '../components/Modal.jsx'
import Badge from '../components/Badge.jsx'
import Spinner from '../components/Spinner.jsx'
import {
  Button, Card, CardHeader, SearchInput, FilterTabs,
  UserCell, DetailList, EmptyState, Input, Select, Alert
} from '../components/UI.jsx'
import './PageCommon.css'

function initials(f='', l='') { return ((f[0]||'')+(l[0]||'')).toUpperCase() }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—' }

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'user', label: 'Regular Users' },
  { value: 'admin', label: 'Admins' },
  { value: 'blocked', label: 'Blocked' },
]

export default function UsersPage() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  // Modals
  const [viewUser, setViewUser] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [createMode, setCreateMode] = useState(false)

  async function load() {
    setLoading(true)
    try { setUsers(await getUsers()) }
    catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let list = [...users]
    if (filter === 'user') list = list.filter(u => u.role === 'user')
    if (filter === 'admin') list = list.filter(u => u.role === 'admin')
    if (filter === 'blocked') list = list.filter(u => u.isBlocked)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
    }
    return list
  }, [users, filter, search])

  async function handleToggleBlock(u) {
    if (!window.confirm(`${u.isBlocked ? 'Unblock' : 'Block'} account: ${u.email}?`)) return
    try {
      await updateUser(u.email, { isBlocked: !u.isBlocked })
      toast(`Account ${u.isBlocked ? 'unblocked' : 'blocked'}`)
      load()
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <div className="page">
      <Topbar
        title="User Management"
        subtitle="Users"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={load}>↻ Refresh</Button>
            <Button variant="primary" size="sm" onClick={() => setCreateMode(true)}>+ New User</Button>
          </>
        }
      />

      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">
              {users.filter(u=>u.role!=='admin').length} users · {users.filter(u=>u.isBlocked).length} blocked
            </p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
        </div>

        <FilterTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} />

        <Card>
          <CardHeader title="Registered Users" meta={`${filtered.length} results`} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Devices</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="loading-cell"><Spinner /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon="👤" text="No users found" sub="Try adjusting your search or filter" /></td></tr>
                ) : filtered.map(u => (
                  <tr key={u._id}>
                    <td><UserCell firstName={u.firstName} lastName={u.lastName} email={u.email} /></td>
                    <td><Badge status={u.role} /></td>
                    <td>
                      <span className="mono">{u.devices?.length || 0}</span>
                      {u.devices?.length > 0 && <span className="muted" style={{fontSize:11,marginLeft:4}}>device{u.devices.length>1?'s':''}</span>}
                    </td>
                    <td><Badge status={u.isBlocked ? 'blocked' : 'active'} /></td>
                    <td>
                      <div className="td-actions">
                        <Button variant="ghost" size="xs" onClick={() => setViewUser(u)}>View</Button>
                        <Button variant="ghost" size="xs" onClick={() => setEditUser(u)}>Edit</Button>
                        <Button
                          variant={u.isBlocked ? 'success' : 'danger'}
                          size="xs"
                          onClick={() => handleToggleBlock(u)}
                        >
                          {u.isBlocked ? 'Unblock' : 'Block'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* View Modal */}
      {viewUser && (
        <Modal title={`${viewUser.firstName} ${viewUser.lastName}`} size="modal-lg" onClose={() => setViewUser(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setViewUser(null)}>Close</Button>
              <Button variant="ghost" onClick={() => { setViewUser(null); setEditUser(viewUser) }}>Edit</Button>
              <Button variant={viewUser.isBlocked?'success':'danger'} onClick={() => { setViewUser(null); handleToggleBlock(viewUser) }}>
                {viewUser.isBlocked ? 'Unblock' : 'Block'} Account
              </Button>
            </>
          }
        >
          <div className="user-detail-hero">
            <div className="user-detail-ava">{initials(viewUser.firstName, viewUser.lastName)}</div>
            <div>
              <div style={{fontSize:20,fontWeight:800}}>{viewUser.firstName} {viewUser.lastName}</div>
              <div className="user-email">{viewUser.email}</div>
              <div style={{marginTop:8,display:'flex',gap:6}}>
                <Badge status={viewUser.role} />
                <Badge status={viewUser.isBlocked ? 'blocked' : 'active'} />
              </div>
            </div>
          </div>
          <DetailList items={[
            { key: 'User ID', value: <span className="mono" style={{fontSize:12}}>{viewUser._id}</span> },
            { key: 'Role', value: viewUser.role },
            { key: 'Status', value: viewUser.isBlocked ? '🚫 Blocked' : '✅ Active' },
            { key: 'Devices', value: viewUser.devices?.length || 0 },
          ]} />
          {viewUser.devices?.length > 0 && (
            <>
              <div className="section-label" style={{marginTop:20}}>Registered Devices</div>
              {viewUser.devices.map(d => (
                <div className="device-chip" key={d.deviceId}>
                  <div className="device-chip-id">{d.deviceId}</div>
                  <div className="muted" style={{fontSize:12,fontFamily:'JetBrains Mono,monospace'}}>{d.deviceEmail}</div>
                  {d.greenHouseLocation && <div className="muted" style={{fontSize:12,marginTop:4}}>📍 {d.greenHouseLocation}</div>}
                </div>
              ))}
            </>
          )}
        </Modal>
      )}

      {/* Edit Modal */}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSave={() => { setEditUser(null); load() }} toast={toast} />}

      {/* Create Modal */}
      {createMode && <CreateUserModal onClose={() => setCreateMode(false)} onSave={() => { setCreateMode(false); load() }} toast={toast} />}
    </div>
  )
}

/* ── Edit User Modal ────────────────────────────────────── */
function EditUserModal({ user, onClose, onSave, toast }) {
  const [form, setForm] = useState({
    firstName: user.firstName, lastName: user.lastName,
    email: user.email, password: '', role: user.role,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    setError('')
    if (!form.firstName || !form.lastName || !form.email) { setError('Name and email are required.'); return }
    setLoading(true)
    try {
      const body = { firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role }
      if (form.password) body.password = form.password
      await updateUser(user.email, body)
      toast('User updated successfully')
      onSave()
    } catch (err) { setError(err.response?.data?.message || err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title="Edit User" onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? <Spinner size={16} /> : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="form-grid-2">
        <Input label="First Name" value={form.firstName} onChange={e=>set('firstName',e.target.value)} />
        <Input label="Last Name"  value={form.lastName} onChange={e=>set('lastName', e.target.value)} />
      </div>
      <Input label="Email" type="email" value={form.email} onChange={e=>set('email',e.target.value)} />
      <Input label="New Password" type="password" placeholder="Leave blank to keep current" value={form.password} onChange={e=>set('password',e.target.value)} />
      <Select label="Role" value={form.role} onChange={e=>set('role',e.target.value)}>
        <option value="user">Regular User</option>
        <option value="admin">Admin</option>
      </Select>
      {error && <Alert type="danger">{error}</Alert>}
    </Modal>
  )
}

/* ── Create User Modal ──────────────────────────────────── */
function CreateUserModal({ onClose, onSave, toast }) {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', role:'user' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleCreate() {
    setError('')
    if (!form.firstName || !form.lastName || !form.email || !form.password) { setError('All fields are required.'); return }
    setLoading(true)
    try {
      await createUser(form)
      toast('User created successfully')
      onSave()
    } catch (err) { setError(err.response?.data?.message || err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title="Create New User" onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={loading}>
            {loading ? <Spinner size={16} /> : 'Create User'}
          </Button>
        </>
      }
    >
      <div className="form-grid-2">
        <Input label="First Name" placeholder="Kasun" value={form.firstName} onChange={e=>set('firstName',e.target.value)} />
        <Input label="Last Name"  placeholder="Perera" value={form.lastName}  onChange={e=>set('lastName', e.target.value)} />
      </div>
      <Input label="Email" type="email" placeholder="user@example.com" value={form.email} onChange={e=>set('email',  e.target.value)} />
      <Input label="Password" type="password" placeholder="min. 8 characters" value={form.password} onChange={e=>set('password',e.target.value)} />
      <Select label="Role" value={form.role} onChange={e=>set('role',e.target.value)}
        hint="Admin accounts have full access to this panel">
        <option value="user">Regular User</option>
        <option value="admin">Admin</option>
      </Select>
      {error && <Alert type="danger">{error}</Alert>}
    </Modal>
  )
}
