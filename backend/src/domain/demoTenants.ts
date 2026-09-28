import type { TenantType } from './tenants.ts'

// The same tenants as the frontend seed (frontend/src/data/seed/tenants.ts).
// Change them together, so the data matches once the frontend reads it from the API.

export interface TenantSeed {
  key: string
  type: TenantType
  name: string
  contactPerson: string | null
  email: string
  notes: string
}

// Tuple types, because the backend checks indexed access strictly.
type CompanyRow = [key: string, name: string, contactPerson: string, notes: string]
type PersonRow = [key: string, name: string, notes: string]

// All names are fictional: every person has the placeholder last name Esimerkki
// (Finnish for "example"). Emails use the reserved example domains.
const companies: TenantSeed[] = (
  [
    ['software-esimerkki', 'Software Esimerkki Oy', 'Aleksi Esimerkki', 'Software development company.'],
    ['accounting-esimerkki', 'Accounting Esimerkki Oy', 'Riikka Esimerkki', 'Accounting and payroll services.'],
    ['design-studio-esimerkki', 'Design Studio Esimerkki Oy', 'Tuomas Esimerkki', 'Downsized in the spring and moved out of A 201.'],
    ['law-office-esimerkki', 'Law Office Esimerkki Oy', 'Hanna Esimerkki', ''],
    ['games-esimerkki', 'Games Esimerkki Oy', 'Joonas Esimerkki', 'Game studio with offices in Joensuu and Kuopio.'],
    ['health-clinic-esimerkki', 'Health Clinic Esimerkki Oy', 'Minna Esimerkki', 'Physiotherapy clinic on the street level.'],
    ['cafe-esimerkki', 'Café Esimerkki Oy', 'Petri Esimerkki', 'Café. Grease trap must be serviced twice a year.'],
    ['outdoor-store-esimerkki', 'Outdoor Store Esimerkki Oy', 'Satu Esimerkki', 'Outdoor equipment store; also rents storage units.'],
    ['florist-esimerkki', 'Florist Esimerkki Oy', 'Elina Esimerkki', ''],
    ['architects-esimerkki', 'Architects Esimerkki Oy', 'Markus Esimerkki', ''],
    ['energy-consulting-esimerkki', 'Energy Consulting Esimerkki Oy', 'Jari Esimerkki', ''],
    ['marketing-esimerkki', 'Marketing Esimerkki Oy', 'Outi Esimerkki', ''],
    ['freight-esimerkki', 'Freight Esimerkki Oy', 'Kimmo Esimerkki', 'Logistics operator; uses the loading docks daily.'],
    ['machinery-esimerkki', 'Machinery Esimerkki Oy', 'Pasi Esimerkki', ''],
    ['yoga-studio-esimerkki', 'Yoga Studio Esimerkki Oy', 'Veera Esimerkki', 'Moving in next month.'],
    ['bookshop-esimerkki', 'Bookshop Esimerkki Oy', 'Raimo Esimerkki', 'Former tenant.'],
  ] satisfies CompanyRow[]
).map(([key, name, contactPerson, notes]) => ({
  key,
  type: 'company' as const,
  name,
  contactPerson,
  email: `info@${key}.example`,
  notes,
}))

const people: TenantSeed[] = (
  [
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
  ] satisfies PersonRow[]
).map(([key, name, notes]) => ({
  key,
  type: 'person' as const,
  name,
  contactPerson: null,
  email: `${key.replace('-', '.')}@example.com`,
  notes,
}))

export const tenantSeeds: TenantSeed[] = [...companies, ...people]
