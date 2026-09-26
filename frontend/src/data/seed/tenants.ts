import type { TenantType } from '../../types/tenant'

export interface TenantSeed {
  key: string
  type: TenantType
  name: string
  contactPerson: string | null
  email: string
  notes: string
}

// All names are fictional: every person has the placeholder last name Esimerkki
// (Finnish for "example"). Emails use the reserved example domains.
const companies: TenantSeed[] = [
  ['nordic-pixel', 'Nordic Pixel Oy', 'Aleksi Esimerkki', 'Software development company.'],
  ['karelia-accounting', 'Karelia Accounting Oy', 'Riikka Esimerkki', 'Accounting and payroll services.'],
  ['saimaa-design', 'Saimaa Design Studio Oy', 'Tuomas Esimerkki', 'Downsized in the spring and moved out of A 201.'],
  ['koivu-manty-law', 'Koivu & Mänty Law Oy', 'Hanna Esimerkki', ''],
  ['revontuli-games', 'Revontuli Games Oy', 'Joonas Esimerkki', 'Game studio with offices in Joensuu and Kuopio.'],
  ['harbour-health', 'Harbour Health Clinic Oy', 'Minna Esimerkki', 'Physiotherapy clinic on the street level.'],
  ['jarvi-coffee', 'Järvi Coffee Oy', 'Petri Esimerkki', 'Café. Grease trap must be serviced twice a year.'],
  ['northwind-outdoor', 'Northwind Outdoor Oy', 'Satu Esimerkki', 'Outdoor equipment store; also rents storage units.'],
  ['lumo-florist', 'Lumo Florist Oy', 'Elina Esimerkki', ''],
  ['kivea-architects', 'Kiveä Architects Oy', 'Markus Esimerkki', ''],
  ['savo-energy', 'Savo Energy Consulting Oy', 'Jari Esimerkki', ''],
  ['kallavesi-marketing', 'Kallavesi Marketing Oy', 'Outi Esimerkki', ''],
  ['arctic-freight', 'Arctic Freight Oy', 'Kimmo Esimerkki', 'Logistics operator; uses the loading docks daily.'],
  ['tervas-machinery', 'Tervas Machinery Oy', 'Pasi Esimerkki', ''],
  ['aurora-yoga', 'Aurora Yoga Studio Oy', 'Veera Esimerkki', 'Moving in next month.'],
  ['old-town-books', 'Old Town Books Oy', 'Raimo Esimerkki', 'Former tenant.'],
].map(([key, name, contactPerson, notes]) => ({
  key,
  type: 'company' as const,
  name,
  contactPerson,
  email: `info@${key}.example`,
  notes,
}))

const people: TenantSeed[] = [
  ['aino-esimerkki', 'Aino Esimerkki', ''],
  ['mikko-esimerkki', 'Mikko Esimerkki', ''],
  ['laura-esimerkki', 'Laura Esimerkki', ''],
  ['juha-esimerkki', 'Juha Esimerkki', ''],
  ['emilia-esimerkki', 'Emilia Esimerkki', 'Has a cat.'],
  ['ville-esimerkki', 'Ville Esimerkki', ''],
  ['sanna-esimerkki', 'Sanna Esimerkki', ''],
  ['antti-esimerkki', 'Antti Esimerkki', ''],
  ['noora-esimerkki', 'Noora Esimerkki', ''],
  ['eero-esimerkki', 'Eero Esimerkki', ''],
  ['helmi-esimerkki', 'Helmi Esimerkki', ''],
  ['onni-esimerkki', 'Onni Esimerkki', ''],
  ['iida-esimerkki', 'Iida Esimerkki', ''],
  ['matias-esimerkki', 'Matias Esimerkki', ''],
  ['kalle-esimerkki', 'Kalle Esimerkki', 'Former tenant.'],
].map(([key, name, notes]) => ({
  key,
  type: 'person' as const,
  name,
  contactPerson: null,
  email: `${key.replace('-', '.')}@example.com`,
  notes,
}))

export const tenantSeeds: TenantSeed[] = [...companies, ...people]
