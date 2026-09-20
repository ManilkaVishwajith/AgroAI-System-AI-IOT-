import './UI.css'

/* Button */
export function Button({ children, variant = 'ghost', size = '', className = '', ...props }) {
  return (
    <button
      className={`btn btn--${variant} ${size ? `btn--${size}` : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/* Input */
export function Input({ label, hint, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className="form-control" {...props} />
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  )
}

/* Select */
export function Select({ label, children, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className="form-control form-select" {...props}>
        {children}
      </select>
    </div>
  )
}

/* Card */
export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function CardHeader({ title, meta, children }) {
  return (
    <div className="card-header">
      <div>
        <div className="card-title">{title}</div>
        {meta && <div className="card-meta">{meta}</div>}
      </div>
      {children && <div className="card-header-right">{children}</div>}
    </div>
  )
}

export function CardBody({ children }) {
  return <div className="card-body">{children}</div>
}

/* Search Input */
export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="search-wrap">
      <span className="search-icon">⌕</span>
      <input
        className="search-input"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

/* Filter Tabs */
export function FilterTabs({ tabs, active, onChange }) {
  return (
    <div className="filter-tabs">
      {tabs.map(tab => (
        <button
          key={tab.value}
          className={`filter-tab${active === tab.value ? ' active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* User Avatar Cell */
export function UserCell({ firstName = '', lastName = '', email, name }) {
  const ini = (firstName[0] || '') + (lastName[0] || '')
  const displayName = name || `${firstName} ${lastName}`
  return (
    <div className="user-cell">
      <div className="user-ava">{ini.toUpperCase() || '?'}</div>
      <div>
        <div className="user-name">{displayName}</div>
        {email && <div className="user-email">{email}</div>}
      </div>
    </div>
  )
}

/* Detail List */
export function DetailList({ items }) {
  return (
    <div className="detail-list">
      {items.map(({ key, value }) => (
        <div className="detail-item" key={key}>
          <span className="detail-key">{key}</span>
          <span className="detail-val">{value}</span>
        </div>
      ))}
    </div>
  )
}

/* Confidence Bar */
export function ConfBar({ value }) {
  const pct = Math.round(value * 100)
  const cls = pct >= 80 ? 'conf-high' : pct >= 50 ? 'conf-mid' : 'conf-low'
  return (
    <div className="conf-wrap">
      <div className="conf-track">
        <div className="conf-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className={`conf-label ${cls}`}>{pct}%</span>
    </div>
  )
}

/* Empty State */
export function EmptyState({ icon = '◌', text, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p className="empty-text">{text}</p>
      {sub && <p className="empty-sub">{sub}</p>}
    </div>
  )
}

/* Alert */
export function Alert({ type = 'info', children }) {
  return <div className={`alert alert--${type}`}>{children}</div>
}

/* Code Block */
export function CodeBlock({ lines }) {
  return (
    <div className="code-block">
      {lines.map(([label, val]) => (
        <div key={label}>
          <span>{label}:</span>&nbsp;&nbsp;{val}
        </div>
      ))}
    </div>
  )
}