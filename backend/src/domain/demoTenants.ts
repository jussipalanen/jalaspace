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

// All names are fictional. Company emails use the reserved `.example` domain.
const companies: TenantSeed[] = (
  [
    ['nordic-pixel', 'Nordic Pixel Oy', 'Aleksi Rautio', 'Software development company.'],
    ['karelia-accounting', 'Karelia Accounting Oy', 'Riikka Hirvonen', 'Accounting and payroll services.'],
    ['saimaa-design', 'Saimaa Design Studio Oy', 'Tuomas Kettunen', 'Downsized in the spring and moved out of A 201.'],
    ['koivu-manty-law', 'Koivu & Mänty Law Oy', 'Hanna Koivu', ''],
    ['revontuli-games', 'Revontuli Games Oy', 'Joonas Pesonen', 'Game studio with offices in Joensuu and Kuopio.'],
    ['harbour-health', 'Harbour Health Clinic Oy', 'Minna Turunen', 'Physiotherapy clinic on the street level.'],
    ['jarvi-coffee', 'Järvi Coffee Oy', 'Petri Järvi', 'Café. Grease trap must be serviced twice a year.'],
    ['northwind-outdoor', 'Northwind Outdoor Oy', 'Satu Heino', 'Outdoor equipment store; also rents storage units.'],
    ['lumo-florist', 'Lumo Florist Oy', 'Elina Lumme', ''],
    ['kivea-architects', 'Kiveä Architects Oy', 'Markus Kivelä', ''],
    ['savo-energy', 'Savo Energy Consulting Oy', 'Jari Karhunen', ''],
    ['kallavesi-marketing', 'Kallavesi Marketing Oy', 'Outi Partanen', ''],
    ['arctic-freight', 'Arctic Freight Oy', 'Kimmo Lahtinen', 'Logistics operator; uses the loading docks daily.'],
    ['tervas-machinery', 'Tervas Machinery Oy', 'Pasi Tervonen', ''],
    ['aurora-yoga', 'Aurora Yoga Studio Oy', 'Veera Aaltonen', 'Moving in next month.'],
    ['old-town-books', 'Old Town Books Oy', 'Raimo Vartiainen', 'Former tenant.'],
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
    ['aino-virtanen', 'Aino Virtanen', ''],
    ['mikko-korhonen', 'Mikko Korhonen', ''],
    ['laura-makinen', 'Laura Mäkinen', ''],
    ['juha-nieminen', 'Juha Nieminen', ''],
    ['emilia-hamalainen', 'Emilia Hämäläinen', 'Has a cat.'],
    ['ville-laine', 'Ville Laine', ''],
    ['sanna-heikkinen', 'Sanna Heikkinen', ''],
    ['antti-koskinen', 'Antti Koskinen', ''],
    ['noora-jarvinen', 'Noora Järvinen', ''],
    ['eero-lehtonen', 'Eero Lehtonen', ''],
    ['helmi-saarinen', 'Helmi Saarinen', ''],
    ['onni-salminen', 'Onni Salminen', ''],
    ['iida-lindqvist', 'Iida Lindqvist', ''],
    ['matias-tuominen', 'Matias Tuominen', ''],
    ['kalle-rantanen', 'Kalle Rantanen', 'Former tenant.'],
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
