import { useState, useEffect, useMemo } from 'react'
import { getUsers } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'
import Topbar from '../components/Topbar.jsx'
import Modal from '../components/Modal.jsx'
import StatCard from '../components/StatCard.jsx'
import Spinner from '../components/Spinner.jsx'
import { Button, Card, CardHeader, SearchInput, UserCell, DetailList, EmptyState } from '../components/UI.jsx'
import { LuRefreshCw, LuRadio, LuMapPin, LuCalendar, LuCpu } from 'react-icons/lu'
import './PageCommon.css'

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
}

export default function DevicesPage() {
  const toast = useToast()
  const [devices, setDevices]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const users = await getUsers()
      const flat = []
      users.forEach(u => {
        (u.devices || []).forEach(d =>
          flat.push({
            ...d,
            ownerName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonymous User',
            ownerEmail: u.email,
            ownerFirst: u.firstName,
            ownerLast: u.lastName,
          })
        )
      })
      setDevices(flat)
    } catch (err) {
      toast(err.message || 'Failed to fetch registered devices', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search) return devices
    const q = search.toLowerCase()
    return devices.filter(d =>
      `${d.deviceId} ${d.ownerEmail} ${d.ownerName} ${d.name || ''} ${d.greenHouseLocation || ''}`
        .toLowerCase()
        .includes(q)
    )
  }, [devices, search])

  const owners = new Set(devices.map(d => d.ownerEmail)).size
  const greenhouses = new Set(devices.map(d => d.greenHouseLocation).filter(Boolean)).size

  return (
    <div className="page">
      <Topbar
        title="Hardware Node Fleet"
        subtitle="AgroAI Admin / IoT Infrastructure"
        actions={
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <LuRefreshCw className={loading ? 'spin' : ''} size={13} style={{ marginRight: 6 }} />
            Refresh
          </Button>
        }
      />

      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Active Sensor Gateways</h1>
            <p className="page-subtitle">
              {devices.length} hardware nodes registered across {owners} verified farming accounts
            </p>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search device ID, owner, greenhouse..."
          />
        </div>

        <div className="stats-grid-3">
          <StatCard
            label="Total Deployed"
            value={loading ? '…' : devices.length}
            sub="provisioned nodes"
            icon="📡"
            color="accent"
          />
          <StatCard
            label="Active Operators"
            value={loading ? '…' : owners}
            sub="farmers managing hardware"
            icon="👥"
            color="info"
          />
          <StatCard
            label="Greenhouse Zones"
            value={loading ? '…' : greenhouses}
            sub="distinct field locations"
            icon="🌿"
            color="warning"
          />
        </div>

        <Card>
          <CardHeader title="Hardware Inventory" meta={`${filtered.length} active node records`} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Device Identifier</th>
                  <th>Service Email</th>
                  <th>Assigned Owner</th>
                  <th>Node Label</th>
                  <th>Greenhouse Zone</th>
                  <th>Provisioned Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="loading-cell">
                      <Spinner size={24} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<LuRadio size={44} />}
                        text="No hardware nodes found"
                        sub="Nodes appear once users register and activate provisioned devices."
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map(d => (
                    <tr key={d.deviceId}>
                      <td>
                        <span className="mono" style={{ color: '#34D399', fontWeight: 700, fontSize: 12.5 }}>
                          {d.deviceId}
                        </span>
                      </td>
                      <td>
                        <span className="mono muted" style={{ fontSize: 11.5 }}>
                          {d.deviceEmail || '—'}
                        </span>
                      </td>
                      <td>
                        <UserCell
                          firstName={d.ownerFirst}
                          lastName={d.ownerLast}
                          email={d.ownerEmail}
                        />
                      </td>
                      <td>
                        {d.name ? (
                          <span style={{ fontWeight: 600 }}>{d.name}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        {d.greenHouseLocation ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <LuMapPin size={13} color="#10B981" />
                            {d.greenHouseLocation}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <LuCalendar size={12} color="#64748B" />
                          <span>{fmtDate(d.activatedAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="td-actions" style={{ justifyContent: 'flex-end' }}>
                          <Button variant="ghost" size="xs" onClick={() => setSelected(d)}>
                            Telemetry
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Device Specification Modal */}
      {selected && (
        <Modal
          title="Hardware Node Specification"
          size="modal-lg"
          onClose={() => setSelected(null)}
          footer={
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
          }
        >
          <div
            style={{
              background: '#0D1622',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                display: 'grid',
                placeItems: 'center',
                color: '#34D399',
              }}
            >
              <LuCpu size={22} />
            </div>
            <div>
              <div
                className="mono"
                style={{ fontSize: 17, color: '#34D399', fontWeight: 800, letterSpacing: '0.5px' }}
              >
                {selected.deviceId}
              </div>
              <div className="mono muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                {selected.deviceEmail || 'No bound device service email'}
              </div>
            </div>
          </div>

          <DetailList
            items={[
              { key: 'Device Name', value: selected.name || 'Default Gateway' },
              { key: 'Greenhouse Zone', value: selected.greenHouseLocation || 'Unassigned' },
              { key: 'Binding Timestamp', value: fmtDate(selected.activatedAt) },
              { key: 'Associated Operator', value: selected.ownerName },
              {
                key: 'Operator Email',
                value: (
                  <span className="mono" style={{ fontSize: 12 }}>
                    {selected.ownerEmail}
                  </span>
                ),
              },
            ]}
          />
        </Modal>
      )}
    </div>
  )
}