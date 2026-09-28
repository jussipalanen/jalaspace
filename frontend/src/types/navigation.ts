import type { ComponentType, SVGProps } from 'react'
import type { MessageKey } from '../i18n/translate'

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface NavItem {
  labelKey: MessageKey
  to: string
  icon: IconComponent
  /** Match only the exact path (used for the dashboard root route). */
  end?: boolean
  /** Shows a count next to the label, e.g. the new applications. */
  badge?: 'newApplications'
}

export interface NavSection {
  titleKey: MessageKey
  items: NavItem[]
}

/** Data attached to routes through React Router's `handle` property. */
export interface RouteHandle {
  titleKey: MessageKey
}
