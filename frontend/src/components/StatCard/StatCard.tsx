import { Link } from 'react-router'
import './StatCard.css'

interface StatCardProps {
  label: string
  value: string
  detail?: string
  to: string
}

export function StatCard({ label, value, detail, to }: StatCardProps) {
  return (
    <Link to={to} className="card stat-card">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {detail && <span className="stat-card__detail">{detail}</span>}
    </Link>
  )
}
