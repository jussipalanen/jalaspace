import { formatArea, formatCurrency, formatNumber, formatPercent } from '../../i18n/format'
import type { MessageKey, Translate } from '../../i18n/translate'
import {
  AREA_FIELDS,
  type Area,
  type AskSort,
  type DateRange,
  type FilterValue,
  type NumberRange,
  type Place,
} from '../../services/ask'
import { formatDate } from '../../utils/format'

/** Translation keys of the places an answer can link to. */
export const PLACE_LABELS: Record<Place, MessageKey> = {
  dashboard: 'dashboard.ask.places.dashboard',
  properties: 'dashboard.ask.places.properties',
  'properties.new': 'dashboard.ask.places.propertiesNew',
  spaces: 'dashboard.ask.places.spaces',
  'spaces.new': 'dashboard.ask.places.spacesNew',
  tenants: 'dashboard.ask.places.tenants',
  'tenants.new': 'dashboard.ask.places.tenantsNew',
  leases: 'dashboard.ask.places.leases',
  'leases.new': 'dashboard.ask.places.leasesNew',
  maintenance: 'dashboard.ask.places.maintenance',
  'maintenance.new': 'dashboard.ask.places.maintenanceNew',
  'settings.profile': 'dashboard.ask.places.settingsProfile',
  'settings.language': 'dashboard.ask.places.settingsLanguage',
  'settings.demoData': 'dashboard.ask.places.settingsDemoData',
  apiDocs: 'dashboard.ask.places.apiDocs',
}

/** The label of a filter or sort field, e.g. "Rooms"; every field has one in each language. */
export const fieldLabel = (t: Translate, field: string) => t(`dashboard.ask.fields.${field}` as MessageKey)

/** Where the labels of each list-valued field's values are, e.g. `space.feature.sauna`. */
const VALUE_LABELS: Partial<Record<Area, Record<string, string>>> = {
  properties: { types: 'properties.type' },
  spaces: { types: 'space.type', statuses: 'space.status', features: 'space.feature' },
  tenants: { types: 'tenant.type', leaseStatuses: 'lease.status' },
  leases: { tenantTypes: 'tenant.type', spaceTypes: 'space.type', statuses: 'lease.status' },
  maintenance: {
    categories: 'maintenance.category',
    priorities: 'maintenance.priority',
    statuses: 'maintenance.status',
  },
}

function valueLabel(t: Translate, area: Area, field: string, value: string): string {
  if (field === 'leaseStatuses' && value === 'none') return t('dashboard.ask.noLeases')
  return t(`${VALUE_LABELS[area]?.[field]}.${value}` as MessageKey)
}

function formatAmount(field: string, value: number, locale: string): string {
  if (field === 'areaM2') return formatArea(value, locale)
  if (field === 'monthlyRentEur') return formatCurrency(Math.round(value * 100), locale)
  if (field === 'occupancyPercent') return formatPercent(value, locale)
  return formatNumber(value, locale)
}

function formatValue(t: Translate, locale: string, area: Area, field: string, value: FilterValue): string {
  const spec = AREA_FIELDS[area][field]
  switch (spec?.kind) {
    case 'enum':
      return (value as string[]).map((item) => valueLabel(t, area, field, item)).join(', ')
    case 'range': {
      const { min, max } = value as NumberRange
      const amount = (number: number) => formatAmount(field, number, locale)
      if (min !== undefined && max !== undefined) {
        return min === max ? amount(min) : t('dashboard.ask.range.between', { min: amount(min), max: amount(max) })
      }
      return min !== undefined
        ? t('dashboard.ask.range.atLeast', { min: amount(min) })
        : t('dashboard.ask.range.atMost', { max: amount(max!) })
    }
    case 'dates': {
      const { from, to } = value as DateRange
      if (from && to) {
        return from === to
          ? formatDate(from)
          : t('dashboard.ask.dates.between', { from: formatDate(from), to: formatDate(to) })
      }
      return from
        ? t('dashboard.ask.dates.from', { from: formatDate(from) })
        : t('dashboard.ask.dates.to', { to: formatDate(to!) })
    }
    case 'boolean':
      return value ? t('dashboard.ask.yes') : t('dashboard.ask.no')
    default:
      return String(value)
  }
}

/** One condition as text, e.g. "Features: Sauna, Parking" or "Area (m²): at least 50 m²". */
export function describeCondition(
  t: Translate,
  locale: string,
  area: Area,
  field: string,
  value: FilterValue,
): string {
  return t('dashboard.ask.condition', {
    field: fieldLabel(t, field),
    value: formatValue(t, locale, area, field, value),
  })
}

/** The sort as text, e.g. "Sort: Area (m²), descending". */
export function describeSort(t: Translate, sort: AskSort): string {
  return t('dashboard.ask.condition', {
    field: t('dashboard.ask.sort'),
    value: t(`dashboard.ask.sortValue.${sort.direction}`, { field: fieldLabel(t, sort.by) }),
  })
}
