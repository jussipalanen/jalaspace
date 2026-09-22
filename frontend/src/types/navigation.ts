import type { ComponentType, SVGProps } from 'react'
import type { MessageKey } from '../i18n/translate'

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface NavItem {
  labelKey: MessageKey
  to: string
  icon: IconComponent
  /** Match only the exact path (used for the dashboard root route). */
  end?: boolean
}

export interface NavSection {
  titleKey: MessageKey
  items: NavItem[]
}

/** Data attached to routes through React Router's `handle` property. */
export interface RouteHandle {
  titleKey: MessageKey
}
