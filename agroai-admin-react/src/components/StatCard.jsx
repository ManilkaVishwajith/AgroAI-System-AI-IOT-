import './StatCard.css'

export default function StatCard({ label, value, sub, icon, color = 'accent' }) {
  return (
    <div className={`stat-card stat-card--${color}`} data-icon={icon}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value stat-value--${color}`}>
        {value ?? '—'}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}