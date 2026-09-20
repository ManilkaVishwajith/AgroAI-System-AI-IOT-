import { useState, useEffect, useMemo } from 'react'
import { getPredictions } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'
import Topbar from '../components/Topbar.jsx'
import Modal from '../components/Modal.jsx'
import StatCard from '../components/StatCard.jsx'
import Spinner from '../components/Spinner.jsx'
import { Button, Card, CardHeader, SearchInput, ConfBar, DetailList, EmptyState } from '../components/UI.jsx'
import { LuRefreshCw, LuClock, LuScanSearch, LuSprout, LuBrainCircuit, LuSparkles } from 'react-icons/lu'
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
        minute: '2-digit',
      })
    : '—'
}

function trunc(s = '', n = 50) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function getUserDisplay(userId) {
  if (!userId) return { name: 'Anonymous Farmer', email: '—' }
  if (typeof userId === 'object') {
    const name = `${userId.firstName || ''} ${userId.lastName || ''}`.trim() || 'Anonymous Farmer'
    const email = userId.email || '—'
    return { name, email }
  }
  const id = String(userId)
  return { name: `Farmer (${id.slice(-6)})`, email: '—' }
}

export default function PredictionsPage() {
  const toast = useToast()
  const [preds, setPreds]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [imgError, setImgError] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await getPredictions()
      setPreds(data || [])
    } catch (err) {
      toast('Could not load vision diagnoses: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search) return preds
    const q = search.toLowerCase()
    return preds.filter(p => {
      const u = getUserDisplay(p.userId)
      return `${p.diseaseName || ''} ${p.description || ''} ${u.name} ${u.email}`
        .toLowerCase()
        .includes(q)
    })
  }, [preds, search])

  const diseases = new Set(preds.map(p => p.diseaseName).filter(Boolean)).size
  const users = new Set(
    preds.map(p => (typeof p.userId === 'object' ? String(p.userId?._id) : String(p.userId)))
  ).size

  const avgConf = preds.length
    ? (preds.reduce((a, p) => a + (p.confidence || 0), 0) / preds.length * 100).toFixed(1) + '%'
    : '—'

  // Disease frequency breakdown
  const freq = useMemo(() => {
    const map = {}
    preds.forEach(p => {
      const key = p.diseaseName || 'Unclassified'
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [preds])

  const maxFreq = freq[0]?.[1] || 1

  // Confidence distribution levels
  const high = preds.filter(p => (p.confidence || 0) >= 0.8).length
  const mid  = preds.filter(p => (p.confidence || 0) >= 0.5 && (p.confidence || 0) < 0.8).length
  const low  = preds.filter(p => (p.confidence || 0) < 0.5).length

  function openDetail(p) {
    setImgError(false)
    setSelected(p)
  }

  return (
    <div className="page">
      <Topbar
        title="Vision Diagnostics"
        subtitle="AgroAI Admin / Disease Inferences"
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
            <h1 className="page-title">Pathology Inferences</h1>
            <p className="page-subtitle">
              {preds.length} image scans analyzed across {diseases} recognized crop pathologies
            </p>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search disease, farmer, or diagnosis..."
          />
        </div>

        {/* Diagnostic Metrics */}
        <div className="stats-grid-4">
          <StatCard
            label="Inferences"
            value={loading ? '…' : preds.length}
            sub="total diagnoses executed"
            icon="🔬"
            color="accent"
          />
          <StatCard
            label="Unique Pathologies"
            value={loading ? '…' : diseases}
            sub="isolated conditions"
            icon="🌿"
            color="info"
          />
          <StatCard
            label="Mean Confidence"
            value={loading ? '…' : avgConf}
            sub="computer vision certainty"
            icon="📊"
            color="warning"
          />
          <StatCard
            label="Farmers Assessed"
            value={loading ? '…' : users}
            sub="active crop reporters"
            icon="👥"
            color="danger"
          />
        </div>

        {/* Telemetry Visualizers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Disease Frequency */}
          <Card>
            <CardHeader title="Prevalent Pathologies" meta="Top detected crop conditions" />
            <div className="card-body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <Spinner size={24} />
                </div>
              ) : freq.length === 0 ? (
                <EmptyState icon={<LuSprout size={36} />} text="No diagnostic data captured" />
              ) : (
                freq.map(([name, count]) => (
                  <div className="chart-bar-row" key={name}>
                    <div className="chart-label" title={name}>
                      {name}
                    </div>
                    <div className="chart-track">
                      <div
                        className="chart-fill"
                        style={{ width: `${(count / maxFreq * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <div className="chart-count">{count}</div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Model Confidence Distribution */}
          <Card>
            <CardHeader title="Certainty Spectrum" meta="Neural network confidence spread" />
            <div className="card-body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <Spinner size={24} />
                </div>
              ) : (
                <>
                  {[
                    { label: 'High (≥80%)', count: high, color: '#34D399' },
                    { label: 'Moderate (50–79%)', count: mid, color: '#FBBF24' },
                    { label: 'Low (<50%)', count: low, color: '#F87171' },
                  ].map(({ label, count, color }) => (
                    <div className="chart-bar-row" key={label}>
                      <div className="chart-label" style={{ color }}>
                        {label}
                      </div>
                      <div className="chart-track">
                        <div
                          className="chart-fill"
                          style={{
                            width: preds.length ? `${(count / preds.length * 100).toFixed(1)}%` : '0%',
                            background: color,
                            boxShadow: `0 0 10px ${color}66`,
                          }}
                        />
                      </div>
                      <div className="chart-count">{count}</div>
                    </div>
                  ))}
                  <hr className="divider" style={{ margin: '16px 0 12px' }} />
                  <div className="muted mono" style={{ textAlign: 'center', fontSize: 11.5 }}>
                    {preds.length} total telemetric observations indexed
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Inferences Table */}
        <Card>
          <CardHeader title="Prediction Feed" meta={`${filtered.length} matching inferences`} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Telemetry Frame</th>
                  <th>Identified Pathology</th>
                  <th>Symptom Signature</th>
                  <th>Confidence</th>
                  <th>Originating Farmer</th>
                  <th>Recorded</th>
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
                        icon={<LuScanSearch size={44} />}
                        text="No matching vision inferences found"
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => {
                    const user = getUserDisplay(p.userId)
                    return (
                      <tr key={p._id}>
                        <td>
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt="Crop scan"
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                objectFit: 'cover',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: '#0D1622',
                                display: 'block',
                              }}
                              onError={e => {
                                e.target.style.display = 'none'
                                e.target.insertAdjacentHTML(
                                  'afterend',
                                  '<div style="width:44px;height:44px;border-radius:10px;background:#0D1622;border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:20px;color:#34D399;">🌿</div>'
                                )
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                background: '#0D1622',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                color: '#34D399',
                              }}
                            >
                              🌿
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
                            {p.diseaseName || 'Healthy / Undetected'}
                          </span>
                        </td>
                        <td style={{ maxWidth: 220, fontSize: 12.5, color: '#94A3B8' }}>
                          {trunc(p.description || 'No diagnostic notes attached.')}
                        </td>
                        <td>
                          <ConfBar value={p.confidence || 0} />
                        </td>
                        <td>
                          <div className="user-name" style={{ fontSize: 13 }}>{user.name}</div>
                          {user.email !== '—' && (
                            <div className="user-email mono">{user.email}</div>
                          )}
                        </td>
                        <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <LuClock size={12} color="#64748B" />
                            <span>{timeAgo(p.predictedAt || p.createdAt)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="td-actions" style={{ justifyContent: 'flex-end' }}>
                            <Button variant="ghost" size="xs" onClick={() => openDetail(p)}>
                              Inspection
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Detail Inspection Modal */}
      {selected && (() => {
        const user    = getUserDisplay(selected.userId)
        const confPct = Math.round((selected.confidence || 0) * 100)
        return (
          <Modal
            title="Pathology Diagnostic Specification"
            size="modal-lg"
            onClose={() => setSelected(null)}
            footer={<Button variant="ghost" onClick={() => setSelected(null)}>Close Inspection</Button>}
          >
            {/* Header Hero */}
            <div
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                padding: '16px 20px',
                background: '#0D1622',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                marginBottom: 20,
              }}
            >
              {!imgError && selected.imageUrl ? (
                <img
                  src={selected.imageUrl}
                  alt="Crop sample"
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 12,
                    objectFit: 'cover',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    flexShrink: 0,
                    background: '#162334',
                  }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 12,
                    background: '#162334',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 42,
                    flexShrink: 0,
                    color: '#34D399',
                  }}
                >
                  🌿
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: '#FFFFFF',
                    letterSpacing: '-0.3px',
                    marginBottom: 8,
                  }}
                >
                  {selected.diseaseName || 'Healthy / Negative'}
                </div>
                <ConfBar value={selected.confidence || 0} />
                <div style={{ fontSize: 13, color: '#34D399', marginTop: 8, fontWeight: 700 }}>
                  {confPct}% Model Confidence Certainty
                </div>
                <div className="muted mono" style={{ fontSize: 11.5, marginTop: 4 }}>
                  Inferred on: {fmtDate(selected.predictedAt || selected.createdAt)}
                </div>
              </div>
            </div>

            {/* Diagnostic Pathology Description */}
            <div className="form-group">
              <label className="form-label">
                <span>PATHOLOGY MORPHOLOGY & CHARACTERISTICS</span>
              </label>
              <div
                style={{
                  background: '#162334',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: '#FFFFFF',
                }}
              >
                {selected.description || (
                  <span className="muted">No descriptive morphology supplied for this signature.</span>
                )}
              </div>
            </div>

            {/* AI Prescribed Remediation */}
            <div className="form-group">
              <label className="form-label" style={{ color: '#34D399' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <LuSparkles size={12} /> RECOMMENDED AGRONOMIC REMEDIATION
                </span>
              </label>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: '#FFFFFF',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)',
                }}
              >
                {selected.solution || (
                  <span style={{ color: '#94A3B8' }}>No clinical remediation strategy on record.</span>
                )}
              </div>
            </div>

            {/* Originating User Metadata */}
            <DetailList
              items={[
                { key: 'Submitting Farmer', value: user.name },
                {
                  key: 'Contact Channel',
                  value: <span className="mono" style={{ fontSize: 12 }}>{user.email}</span>,
                },
                {
                  key: 'Diagnosis Telemetry ID',
                  value: <span className="mono muted" style={{ fontSize: 11.5 }}>{selected._id}</span>,
                },
              ]}
            />
          </Modal>
        )
      })()}
    </div>
  )
}