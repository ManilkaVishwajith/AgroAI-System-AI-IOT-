import { useState, useEffect, useMemo } from 'react'
import { getDeviceRequests, approveRequest, rejectRequest } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'
import Topbar from '../components/Topbar.jsx'
import Modal from '../components/Modal.jsx'
import StatCard from '../components/StatCard.jsx'
import Badge from '../components/Badge.jsx'
import Spinner from '../components/Spinner.jsx'
import {
  Button, Card, CardHeader, SearchInput, FilterTabs,
  DetailList, EmptyState, Alert, CodeBlock
} from '../components/UI.jsx'
import { LuRefreshCw, LuClock, LuClipboardList, LuCheck, LuX, LuCopy, LuCpu } from 'react-icons/lu'
import './PageCommon.css'

function timeAgo(d) {
  if (!d) return '—'
  const diff = Math.floor((Date.now() - new Date(d)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—'
}

function trunc(s = '', n = 45) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

const TABS = [
  { value: 'all', label: 'All Requests' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function DeviceRequestsPage() {
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [detailReq, setDetailReq] = useState(null)
  const [approveReq, setApproveReq] = useState(null)
  const [approveResult, setApproveResult] = useState(null)
  const [approving, setApproving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setRequests(await getDeviceRequests())
    } catch (err) {
      toast(err.message || 'Failed to fetch device requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = filter === 'all' ? requests : requests.filter(r => r.status === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        `${r.username} ${r.userEmail} ${r.phoneNumber} ${r.address}`
          .toLowerCase()
          .includes(q)
      )
    }
    return list
  }, [requests, filter, search])

  const pending = requests.filter(r => r.status === 'pending').length
  const approved = requests.filter(r => r.status === 'approved').length
  const rejected = requests.filter(r => r.status === 'rejected').length

  async function handleApprove(id) {
    setApproving(true)
    try {
      const result = await approveRequest(id)
      setApproveResult(result)
      toast('Device request approved & credentials provisioned!')
      load()
    } catch (err) {
      toast(err.message || 'Approval failed', 'error')
    } finally {
      setApproving(false)
    }
  }

  async function handleReject(req) {
    if (!window.confirm(`Reject hardware provisioning request from ${req.username}?`)) return
    try {
      await rejectRequest(req._id)
      toast('Request marked as rejected', 'info')
      load()
    } catch (err) {
      toast(err.message || 'Rejection failed', 'error')
    }
  }

  return (
    <div className="page">
      <Topbar
        title="Hardware Provisioning"
        subtitle="AgroAI Admin / Device Requests"
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
            <h1 className="page-title">Device Allocation Requests</h1>
            <p className="page-subtitle">
              {requests.length} total applications · {pending} awaiting gateway assignment
            </p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search applicant, email, address..." />
        </div>

        <div className="stats-grid-4">
          <StatCard
            label="Total Inquiries"
            value={loading ? '…' : requests.length}
            sub="lifetime applications"
            icon="📋"
            color="white"
          />
          <StatCard
            label="Pending Review"
            value={loading ? '…' : pending}
            sub="requires verification"
            icon="⏳"
            color="warning"
          />
          <StatCard
            label="Provisioned"
            value={loading ? '…' : approved}
            sub="hardware activated"
            icon="✅"
            color="accent"
          />
          <StatCard
            label="Declined"
            value={loading ? '…' : rejected}
            sub="rejected requests"
            icon="✕"
            color="danger"
          />
        </div>

        {pending > 0 && (
          <Alert type="warning">
            Action Required: {pending} IoT gateway request{pending > 1 ? 's are' : ' is'} currently pending administrative review.
          </Alert>
        )}

        <FilterTabs tabs={TABS} active={filter} onChange={setFilter} />

        <Card>
          <CardHeader title="Provisioning Pipeline" meta={`${filtered.length} applications match criteria`} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant Details</th>
                  <th>Contact</th>
                  <th>Destination Address</th>
                  <th>Status</th>
                  <th>Provisioned Node</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="loading-cell"><Spinner size={24} /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={<LuClipboardList size={44} />} text="No device requests found" /></td></tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div className="user-name">{r.username}</div>
                        <div className="user-email">{r.userEmail}</div>
                      </td>
                      <td className="mono muted" style={{ fontSize: 12 }}>{r.phoneNumber || '—'}</td>
                      <td style={{ maxWidth: 200, fontSize: 12, color: '#94A3B8' }}>{trunc(r.address)}</td>
                      <td><Badge status={r.status} /></td>
                      <td>
                        {r.deviceId ? (
                          <span className="mono" style={{ color: '#34D399', fontSize: 12, fontWeight: 700 }}>
                            {r.deviceId}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <LuClock size={12} />
                          <span>{timeAgo(r.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="td-actions" style={{ justifyContent: 'flex-end' }}>
                          <Button variant="ghost" size="xs" onClick={() => setDetailReq(r)}>
                            Inspect
                          </Button>
                          {r.status === 'pending' && (
                            <>
                              <Button
                                variant="success"
                                size="xs"
                                onClick={() => { setApproveReq(r); setApproveResult(null) }}
                              >
                                <LuCheck size={12} /> Approve
                              </Button>
                              <Button variant="danger" size="xs" onClick={() => handleReject(r)}>
                                <LuX size={12} /> Reject
                              </Button>
                            </>
                          )}
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

      {/* Detail Modal */}
      {detailReq && (
        <Modal
          title="Hardware Request Specification"
          size="modal-lg"
          onClose={() => setDetailReq(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDetailReq(null)}>Close</Button>
              {detailReq.status === 'pending' && (
                <>
                  <Button
                    variant="success"
                    onClick={() => {
                      const target = detailReq
                      setDetailReq(null)
                      setApproveReq(target)
                      setApproveResult(null)
                    }}
                  >
                    <LuCheck size={14} style={{ marginRight: 4 }} /> Provision Node
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      const target = detailReq
                      setDetailReq(null)
                      handleReject(target)
                    }}
                  >
                    <LuX size={14} style={{ marginRight: 4 }} /> Reject Application
                  </Button>
                </>
              )}
            </>
          }
        >
          <DetailList
            items={[
              { key: 'Applicant Name', value: detailReq.username },
              { key: 'Account Email', value: <span className="mono" style={{ fontSize: 12 }}>{detailReq.userEmail}</span> },
              { key: 'Contact Phone', value: <span className="mono">{detailReq.phoneNumber || '—'}</span> },
              { key: 'Physical Address', value: detailReq.address },
              { key: 'Application Status', value: <Badge status={detailReq.status} /> },
              { key: 'Timestamp', value: fmtDate(detailReq.createdAt) },
            ]}
          />

          {detailReq.status === 'approved' && (
            <>
              <hr className="divider" />
              <div className="form-label" style={{ marginBottom: 12 }}>
                PROVISIONED HARDWARE CREDENTIALS
              </div>
              <Alert type="warning">
                Flash and imprint these credentials onto the physical node package prior to shipment.
              </Alert>
              <CodeBlock
                lines={[
                  ['Device ID', detailReq.deviceId || '—'],
                  ['Device Email', detailReq.deviceEmail || '—'],
                  ['Secret Key', detailReq.deviceSecret || '—'],
                ]}
              />
            </>
          )}
        </Modal>
      )}

      {/* Approve Modal */}
      {approveReq && (
        <Modal
          title={approveResult ? 'Hardware Node Provisioned' : 'Authorize & Generate Hardware Gateway'}
          onClose={() => { setApproveReq(null); setApproveResult(null) }}
          footer={
            approveResult ? (
              <Button variant="primary" onClick={() => { setApproveReq(null); setApproveResult(null) }}>
                Complete & Dismiss
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => { setApproveReq(null); setApproveResult(null) }}
                  disabled={approving}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleApprove(approveReq._id)}
                  disabled={approving}
                >
                  {approving ? (
                    <>
                      <Spinner size={14} /> Provisioning Sensor Node…
                    </>
                  ) : (
                    <>
                      <LuCpu size={14} style={{ marginRight: 6 }} /> Authorize & Provision
                    </>
                  )}
                </Button>
              </>
            )
          }
        >
          {!approveResult ? (
            <>
              <Alert type="info">
                Authorizing will create a new physical gateway record, bind it to MongoDB, and register authentication credentials in Firebase.
              </Alert>
              <DetailList
                items={[
                  { key: 'Applicant', value: approveReq.username },
                  { key: 'Binding Email', value: approveReq.userEmail },
                  { key: 'Delivery Location', value: approveReq.address },
                ]}
              />
            </>
          ) : (
            <>
              <Alert type="success">
                Hardware node successfully provisioned and attached to target account!
              </Alert>
              <CodeBlock
                lines={[
                  ['Hardware Node ID', approveResult.deviceId],
                  ['Service Account', approveResult.deviceEmail],
                  ['Master Secret', approveResult.secret],
                  ['Dispatch Location', approveResult.shippingAddress],
                  ['Assigned Tenant', approveResult.forUser],
                ]}
              />
              <Alert type="danger" style={{ marginTop: 14 }}>
                Capture these credentials immediately. Master secrets are cryptographically hashed and cannot be retrieved later.
              </Alert>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}