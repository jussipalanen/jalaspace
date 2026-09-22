export const STORAGE_KEY_PREFIX = 'jalaspace_'

/** Namespaced localStorage keys used by JalaSpace. */
export const STORAGE_KEYS = {
  session: 'jalaspace_session',
  properties: 'jalaspace_properties',
  spaces: 'jalaspace_units',
  tenants: 'jalaspace_tenants',
  leases: 'jalaspace_leases',
  maintenance: 'jalaspace_maintenance',
  seedVersion: 'jalaspace_seed_version',
  language: 'jalaspace_language',
} as const
