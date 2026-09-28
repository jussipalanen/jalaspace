import type { ApplicationStatus } from './applications.ts'
import type { TenantType } from './tenants.ts'

// The same applications as the frontend seed (frontend/src/data/seed/applications.ts).
// Change them together, so the data matches once the frontend reads it from the API.

export interface ApplicationSeed {
  property: string
  /** Space index (0-based, in generation order) within the property. */
  spaceIndex: number
  applicantType: TenantType
  name: string
  contactPerson: string | null
  email: string
  phone: string | null
  /** Offset in days from today. */
  desiredStartInDays: number
  message: string
  status: ApplicationStatus
  createdDaysAgo: number
  /** When the review started or the decision was made; missing when nothing has happened since. */
  updatedDaysAgo?: number
}

// All names are fictional: every person has the placeholder last name Esimerkki
// (Finnish for "example"). Emails use the reserved example domains. Open
// applications are only for spaces that can be applied for: available and not
// reserved by an upcoming lease.
export const applicationSeeds: ApplicationSeed[] = [
  {
    // A 302 was reserved for Aurora Yoga Studio in the meantime.
    property: 'joensuu-center',
    spaceIndex: 11,
    applicantType: 'company',
    name: 'Pilates Studio Esimerkki Oy',
    contactPerson: 'Emma Esimerkki',
    email: 'info@pilates-studio-esimerkki.example',
    phone: '+358501234561',
    desiredStartInDays: 30,
    message: 'We are looking for a bright studio for group classes of up to 12 people.',
    status: 'rejected',
    createdDaysAgo: 40,
    updatedDaysAgo: 30,
  },
  {
    property: 'tampere-hervanta',
    spaceIndex: 7,
    applicantType: 'company',
    name: 'Print Esimerkki Oy',
    contactPerson: 'Sami Esimerkki',
    email: 'info@print-esimerkki.example',
    phone: null,
    desiredStartInDays: 14,
    message: 'Storage for paper stock and finished print orders.',
    status: 'withdrawn',
    createdDaysAgo: 20,
    updatedDaysAgo: 12,
  },
  {
    property: 'kuopio-harbour',
    spaceIndex: 9,
    applicantType: 'company',
    name: 'Analytics Esimerkki Oy',
    contactPerson: 'Tuulia Esimerkki',
    email: 'info@analytics-esimerkki.example',
    phone: '+358501234562',
    desiredStartInDays: 45,
    message: 'A team of six data analysts. We need parking for two cars.',
    status: 'in_review',
    createdDaysAgo: 6,
    updatedDaysAgo: 3,
  },
  {
    property: 'helsinki-kallio',
    spaceIndex: 10,
    applicantType: 'person',
    name: 'Oskari Esimerkki',
    contactPerson: null,
    email: 'oskari.esimerkki@example.com',
    phone: '+358501234563',
    desiredStartInDays: 21,
    message: 'I work nearby and would like a home with a sauna. No pets, non-smoker.',
    status: 'in_review',
    createdDaysAgo: 4,
    updatedDaysAgo: 2,
  },
  {
    property: 'kuopio-harbour',
    spaceIndex: 16,
    applicantType: 'company',
    name: 'Robotics Esimerkki Oy',
    contactPerson: 'Ilkka Esimerkki',
    email: 'info@robotics-esimerkki.example',
    phone: null,
    desiredStartInDays: 60,
    message: '',
    status: 'submitted',
    createdDaysAgo: 2,
  },
  {
    property: 'joensuu-center',
    spaceIndex: 4,
    applicantType: 'company',
    name: 'Consulting Esimerkki Oy',
    contactPerson: 'Tapio Esimerkki',
    email: 'info@consulting-esimerkki.example',
    phone: '+358501234564',
    desiredStartInDays: 30,
    message: 'Two consultants looking for a small office with a kitchenette.',
    status: 'submitted',
    createdDaysAgo: 1,
  },
  {
    property: 'helsinki-kallio',
    spaceIndex: 10,
    applicantType: 'person',
    name: 'Lotta Esimerkki',
    contactPerson: null,
    email: 'lotta.esimerkki@example.com',
    phone: '+358501234565',
    desiredStartInDays: 30,
    message: 'We are a family of two adults and one child looking for a home in Kallio.',
    status: 'submitted',
    createdDaysAgo: 1,
  },
]
