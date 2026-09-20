import './Topbar.css'

export default function Topbar({ title, subtitle, actions }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{title}</div>
        <div className="topbar-breadcrumb">AgroAI Admin / {subtitle || title}</div>
      </div>
      <div className="topbar-right">
        <span className="status-dot" title="Connected" />
        {actions}
      </div>
    </div>
  )
}
