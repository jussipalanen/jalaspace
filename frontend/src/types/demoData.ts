import type { Lease } from './lease'
import type { MaintenanceTask } from './maintenance'
import type { Property } from './property'
import type { Space } from './space'
import type { Tenant } from './tenant'

/** The complete demo dataset, as seeded on first visit and restored on reset. */
export interface DemoData {
  properties: Property[]
  spaces: Space[]
  tenants: Tenant[]
  leases: Lease[]
  maintenance: MaintenanceTask[]
}
