import type { ReactNode } from 'react'
import type { IconComponent } from '../../types/navigation'
import './EmptyState.css'

interface EmptyStateProps {
  icon?: IconComponent
  title: string
  description?: string
  children?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state__icon">
          <Icon width={24} height={24} />
        </div>
      )}
      <h2 className="empty-state__title">{title}</h2>
      {description && <p className="empty-state__description">{description}</p>}
      {children && <div className="empty-state__content">{children}</div>}
    </div>
  )
}
