import { Link } from 'react-router'
import './StatCard.css'

interface StatCardProps {
  label: string
  value: string
  detail?: string
  /** Makes the whole card a link. */
  to?: string
}

export function StatCard({ label, value, detail, to }: StatCardProps) {
  const content = (
    <>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {detail && <span className="stat-card__detail">{detail}</span>}
    </>
  )
  return to ? (
    <Link to={to} className="card stat-card stat-card--link">
      {content}
    </Link>
  ) : (
    <div className="card stat-card">{content}</div>
  )
}
