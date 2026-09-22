import type { ComponentType, SVGProps } from 'react'

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface NavItem {
  label: string
  to: string
  icon: IconComponent
  /** Match only the exact path (used for the dashboard root route). */
  end?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/** Data attached to routes through React Router's `handle` property. */
export interface RouteHandle {
  title: string
}
