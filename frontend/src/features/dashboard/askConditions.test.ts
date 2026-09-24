import { describe, expect, it } from 'vitest'
import { en, type Messages } from '../../i18n/locales/en'
import { fi } from '../../i18n/locales/fi'
import { createTranslator } from '../../i18n/translate'
import { AREA_FIELDS, AREA_SORTS, AREAS, PLACE_PATHS, type Place } from '../../services/ask'
import { describeCondition, describeSort, fieldLabel, PLACE_LABELS } from './askConditions'

// Without an English fallback, a missing message comes back as its key.
const translators = {
  en: createTranslator(en, 'en-GB', {} as Messages),
  fi: createTranslator(fi, 'fi-FI', {} as Messages),
}
const looksLikeKey = /\b[a-z]+\.[a-zA-Z_]+\.[a-zA-Z_]+/

describe.each(Object.entries(translators))('Ask conditions in %s', (language, t) => {
  const locale = language === 'fi' ? 'fi-FI' : 'en-GB'

  it('has a label for every filter and sort field and every place', () => {
    for (const area of AREAS) {
      for (const field of [...Object.keys(AREA_FIELDS[area]), ...AREA_SORTS[area]]) {
        expect(fieldLabel(t, field), `${area}.${field}`).not.toMatch(/^dashboard\./)
      }
    }
    for (const place of Object.keys(PLACE_PATHS) as Place[]) {
      expect(t(PLACE_LABELS[place]), place).not.toMatch(/^dashboard\./)
    }
  })

  it('has a label for every value of every list field', () => {
    for (const area of AREAS) {
      for (const [field, spec] of Object.entries(AREA_FIELDS[area])) {
        if (spec.kind !== 'enum') continue
        for (const value of spec.values) {
          expect(describeCondition(t, locale, area, field, [value]), `${area}.${field}.${value}`).not.toMatch(
            looksLikeKey,
          )
        }
      }
    }
  })
})

describe('describing conditions', () => {
  const t = translators.en

  it('formats each kind of value', () => {
    expect(describeCondition(t, 'en-GB', 'spaces', 'features', ['sauna', 'parking'])).toBe(
      'Features: Sauna, Parking',
    )
    expect(describeCondition(t, 'en-GB', 'spaces', 'rooms', { min: 3, max: 3 })).toBe('Rooms: 3')
    expect(describeCondition(t, 'en-GB', 'spaces', 'areaM2', { min: 50 })).toBe('Area (m²): at least 50 m²')
    expect(describeCondition(t, 'en-GB', 'leases', 'monthlyRentEur', { min: 500, max: 1500 })).toBe(
      'Monthly rent (€): €500.00–€1,500.00',
    )
    expect(describeCondition(t, 'en-GB', 'properties', 'occupancyPercent', { max: 90 })).toBe(
      'Occupancy (%): at most 90%',
    )
    expect(describeCondition(t, 'en-GB', 'leases', 'endDate', { from: '2026-09-24', to: '2026-12-31' })).toBe(
      'End date: 24.9.2026–31.12.2026',
    )
    expect(describeCondition(t, 'en-GB', 'maintenance', 'dueDate', { to: '2026-10-01' })).toBe(
      'Due date: until 1.10.2026',
    )
    expect(describeCondition(t, 'en-GB', 'maintenance', 'overdue', true)).toBe('Overdue: Yes')
    expect(describeCondition(t, 'en-GB', 'tenants', 'leaseStatuses', ['none'])).toBe('Leases: No leases')
    expect(describeCondition(t, 'en-GB', 'spaces', 'city', 'Helsinki')).toBe('City: Helsinki')
    expect(describeSort(t, { by: 'areaM2', direction: 'desc' })).toBe('Sort: Area (m²), descending')
  })

  it('formats numbers for the language', () => {
    expect(describeCondition(translators.fi, 'fi-FI', 'spaces', 'areaM2', { min: 62.5 })).toBe(
      'Pinta-ala (m²): vähintään 62,5 m²',
    )
  })
})
