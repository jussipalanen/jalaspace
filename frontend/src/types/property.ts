import type { Entity } from './common'

export type PropertyType = 'office' | 'retail' | 'industrial' | 'residential' | 'mixed_use'

export interface Property extends Entity {
  name: string
  address: string
  postalCode: string
  city: string
  type: PropertyType
  description: string
}
