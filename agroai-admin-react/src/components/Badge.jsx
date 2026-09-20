import './Badge.css'

const COLOR_MAP = {
  active: 'green',
  approved: 'green',
  online: 'green',
  healthy: 'green',
  user: 'gray',
  admin: 'blue',
  processing: 'blue',
  pending: 'yellow',
  warning: 'yellow',
  rejected: 'red',
  blocked: 'red',
  offline: 'red',
  critical: 'red',
}

export default function Badge({ status, label, color, icon = true }) {
  const c = color || COLOR_MAP[status?.toLowerCase()] || 'gray'
  const text = label || status || '—'

  return (
    <span className={`badge badge--${c} ${!icon ? 'badge--no-icon' : ''}`}>
      {text}
    </span>
  )
}