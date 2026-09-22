import type { ReactNode } from 'react'
import type { IconComponent } from '../../types/navigation'
import './EmptyState.css'

interface EmptyStateProps {
  icon?: IconComponent
  title: string
  description?: string
  children?: ReactNode
  /** Use `h1` when the empty state is the page's main content (e.g. not found). */
  headingLevel?: 'h1' | 'h2'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  headingLevel: Heading = 'h2',
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state__icon">
          <Icon width={24} height={24} />
        </div>
      )}
      <Heading className="empty-state__title">{title}</Heading>
      {description && <p className="empty-state__description">{description}</p>}
      {children && <div className="empty-state__content">{children}</div>}
    </div>
  )
}
