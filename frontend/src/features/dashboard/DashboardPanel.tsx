import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'

interface DashboardPanelProps {
  id: string
  title: string
  viewAll?: { to: string; label: string }
  children: ReactNode
  className?: string
}

export function DashboardPanel({ id, title, viewAll, children, className }: DashboardPanelProps) {
  return (
    <section
      className={['card', 'dashboard-panel', className].filter(Boolean).join(' ')}
      aria-labelledby={id}
    >
      <div className="dashboard-panel__header">
        <h2 id={id} className="dashboard-panel__title">
          {title}
        </h2>
        {viewAll && (
          <Link to={viewAll.to} className="dashboard-panel__link">
            {viewAll.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export function PanelEmpty({ children }: { children: ReactNode }) {
  return <p className="dashboard-panel__empty">{children}</p>
}

/** Secondary details separated by dots; each part stays on one line. */
export function MetaLine({ parts }: { parts: (string | null | undefined | false)[] }) {
  const visible = parts.filter((part): part is string => Boolean(part))
  return (
    <p className="dashboard-list__meta">
      {visible.map((part, index) => (
        // The separator stays outside the no-wrap span so lines can break between parts.
        <Fragment key={index}>
          {index > 0 && ' · '}
          <span className="dashboard-list__meta-part">{part}</span>
        </Fragment>
      ))}
    </p>
  )
}
