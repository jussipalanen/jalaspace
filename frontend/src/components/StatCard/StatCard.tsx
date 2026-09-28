import type { ReactNode } from 'react'
import { Link } from 'react-router'
import './StatCard.css'

interface StatCardProps {
  label: string
  value: string
  detail?: string
  /** A small chart next to the value, e.g. a ring. */
  chart?: ReactNode
  /** The chart's legend, below the value. */
  legend?: ReactNode
  /** Makes the whole card a link. */
  to?: string
}

export function StatCard({ label, value, detail, chart, legend, to }: StatCardProps) {
  const content = (
    <>
      <span className="stat-card__body">
        <span className="stat-card__text">
          <span className="stat-card__label">{label}</span>
          <span className="stat-card__value">{value}</span>
          {detail && <span className="stat-card__detail">{detail}</span>}
        </span>
        {chart}
      </span>
      {legend}
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
