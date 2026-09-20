import { useState, useEffect, useMemo } from 'react'
import { getChats } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'
import Topbar from '../components/Topbar.jsx'
import Modal from '../components/Modal.jsx'
import StatCard from '../components/StatCard.jsx'
import Spinner from '../components/Spinner.jsx'
import { Button, Card, CardHeader, SearchInput, EmptyState } from '../components/UI.jsx'
import { IoSparklesOutline } from 'react-icons/io5'
import { LuMessageSquare, LuRefreshCw, LuClock, LuLayers, LuUserCheck, LuExternalLink, LuHash } from 'react-icons/lu'
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
  return d ? new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'
}

function trunc(s = '', n = 60) { return s.length > n ? s.slice(0, n) + '…' : s }

function parseReply(reply) {
  if (!reply) return '—'
  if (typeof reply === 'string') return reply
  if (typeof reply === 'object') {
    return reply.text || reply.message || reply.reply || reply.response || JSON.stringify(reply)
  }
  return String(reply)
}

function getUserDisplay(userId) {
  if (!userId) return { name: 'Unknown User', email: '', label: 'Unknown' }
  if (typeof userId === 'object') {
    const name = `${userId.firstName || ''} ${userId.lastName || ''}`.trim() || 'Unknown User'
    return { name, email: userId.email || '', label: name }
  }
  const id = String(userId)
  return { name: id, email: '', label: id.slice(-10) + '…' }
}

export default function ChatsPage() {
  const toast = useToast()
  const [chats, setChats]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState(null)
  const [convModal, setConvModal]   = useState(null)

  async function load() {
    setLoading(true)
    try { setChats(await getChats()) }
    catch (err) { toast('Could not load chats: ' + err.message, 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!search) return chats
    const q = search.toLowerCase()
    return chats.filter(c => {
      const user = getUserDisplay(c.userId)
      return `${c.message} ${parseReply(c.reply)} ${c.conversationId || ''} ${user.name} ${user.email}`
        .toLowerCase().includes(q)
    })
  }, [chats, search])

  const conversations = useMemo(() => {
    const map = {}
    chats.forEach(c => {
      const key = c.conversationId || c._id
      if (!map[key]) map[key] = []
      map[key].push(c)
    })
    Object.values(map).forEach(msgs => msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)))
    return map
  }, [chats])

  const convIds = Object.keys(conversations).length
  const userSet = new Set(chats.map(c => typeof c.userId === 'object' ? c.userId?._id : String(c.userId))).size

  function openConversation(c) {
    const key = c.conversationId || c._id
    setConvModal({ key, messages: conversations[key] || [c] })
  }

  return (
    <div className="page">
      <Topbar 
        title="Chat Telemetry Logs" 
        subtitle="AgroAI Admin / LLM Intelligence" 
        actions={
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <LuRefreshCw className={loading ? 'spin' : ''} style={{ marginRight: 6, fontSize: 13 }} /> Refresh
          </Button>
        } 
      />

      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Assistant Interactions</h1>
            <p className="page-subtitle">{chats.length} telemetry messages captured · {convIds} unique session threads</p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search messages, users, or IDs..." />
        </div>

        <div className="stats-grid-3">
          <StatCard label="Total Exchanges" value={loading ? '…' : chats.length} sub="historical prompts" icon="💬" color="accent" />
          <StatCard label="Conversations" value={loading ? '…' : convIds} sub="session pipelines" icon="🗂" color="info" />
          <StatCard label="Active Chatters" value={loading ? '…' : userSet} sub="unique users engaged" icon="👥" color="warning" />
        </div>

        <Card>
          <CardHeader title="Live Conversation Logs" meta={`${filtered.length} indexed prompts`} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User Identity</th>
                  <th>Inquiry Message</th>
                  <th>AgroAI Response</th>
                  <th>Session Thread</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="loading-cell"><Spinner size={24} /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon={<LuMessageSquare size={44} />} text="No telemetry records match query" /></td></tr>
                ) : filtered.map(c => {
                  const user  = getUserDisplay(c.userId)
                  const reply = parseReply(c.reply)
                  return (
                    <tr key={c._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-ava">
                            {(user.name[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div className="user-name">{user.name}</div>
                            {user.email && <div className="user-email">{user.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="chat-msg-preview">{trunc(c.message, 48)}</div>
                      </td>
                      <td>
                        <div className="chat-reply-preview">{trunc(reply, 48)}</div>
                      </td>
                      <td>
                        {c.conversationId ? (
                          <span className="mono muted thread-pill">
                            <LuHash size={11} />
                            {trunc(c.conversationId, 12)}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <LuClock size={13} color="#64748B" />
                          <span>{timeAgo(c.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="td-actions" style={{ justifyContent: 'flex-end' }}>
                          <Button variant="ghost" size="xs" onClick={() => setSelected(c)}>
                            View
                          </Button>
                          {c.conversationId && (
                            <Button variant="info" size="xs" onClick={() => openConversation(c)}>
                              Thread
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Single Message Modal */}
      {selected && (() => {
        const user  = getUserDisplay(selected.userId)
        const reply = parseReply(selected.reply)
        return (
          <Modal
            title="Interaction Log Detail"
            size="modal-lg"
            onClose={() => setSelected(null)}
            footer={
              <>
                {selected.conversationId && (
                  <Button variant="info" onClick={() => { setSelected(null); openConversation(selected) }}>
                    <LuExternalLink size={14} style={{ marginRight: 6 }} /> Full Session Thread
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
              </>
            }
          >
            <div className="chat-modal-user-bar">
              <div className="user-ava" style={{ width: 44, height: 44, fontSize: 15 }}>
                {(user.name[0] || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="user-name" style={{ fontSize: 15 }}>{user.name}</div>
                {user.email && <div className="user-email">{user.email}</div>}
              </div>
              <div className="chat-modal-date">{fmtDate(selected.createdAt)}</div>
            </div>

            <div className="chat-view">
              <div className="chat-bubble-group user-side">
                <div className="chat-sender-label">
                  <span>USER INQUIRY</span>
                </div>
                <div className="bubble-user">{selected.message}</div>
              </div>

              <div className="chat-bubble-group bot-side">
                <div className="chat-sender-label bot-label">
                  <IoSparklesOutline size={13} />
                  <span>AGROAI AGRIBOT ENGINE</span>
                </div>
                <div className="bubble-bot">{reply}</div>
              </div>
            </div>

            <div className="chat-modal-meta">
              <div className="meta-item">
                <span className="detail-key">Message ID</span>
                <span className="mono muted">{selected._id}</span>
              </div>
              {selected.conversationId && (
                <div className="meta-item">
                  <span className="detail-key">Session ID</span>
                  <span className="mono muted">{selected.conversationId}</span>
                </div>
              )}
            </div>
          </Modal>
        )
      })()}

      {/* Conversation Thread Modal */}
      {convModal && (() => {
        const msgs    = convModal.messages
        const first   = msgs[0]
        const user    = getUserDisplay(first?.userId)
        return (
          <Modal
            title={`Conversation Thread (${msgs.length} exchange${msgs.length !== 1 ? 's' : ''})`}
            size="modal-lg"
            onClose={() => setConvModal(null)}
            footer={<Button variant="ghost" onClick={() => setConvModal(null)}>Close Thread</Button>}
          >
            <div className="chat-modal-user-bar">
              <div className="user-ava" style={{ width: 44, height: 44, fontSize: 15 }}>
                {(user.name[0] || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="user-name" style={{ fontSize: 15 }}>{user.name}</div>
                {user.email && <div className="user-email">{user.email}</div>}
              </div>
              <div className="chat-modal-date mono">
                Session: {trunc(convModal.key, 18)}
              </div>
            </div>

            <div className="chat-thread-view">
              {msgs.map((msg) => {
                const reply = parseReply(msg.reply)
                return (
                  <div key={msg._id} className="chat-thread-exchange">
                    <div className="thread-time-badge">
                      <LuClock size={11} /> {fmtDate(msg.createdAt)}
                    </div>

                    <div className="chat-bubble-group user-side">
                      <div className="bubble-user">{msg.message}</div>
                    </div>

                    <div className="chat-bubble-group bot-side">
                      <div className="chat-sender-label bot-label">
                        <IoSparklesOutline size={12} />
                        <span>AgroAI</span>
                      </div>
                      <div className="bubble-bot">{reply}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Modal>
        )
      })()}
    </div>
  )
}