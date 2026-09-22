import { describe, expect, it } from 'vitest'
import { formatArea, formatCurrency, formatNumber, formatPercent } from './format'

const nbsp = '\u00a0'

describe('locale-aware formatting', () => {
  it('formats numbers and areas', () => {
    expect(formatNumber(1234.5, 'en-GB')).toBe('1,234.5')
    expect(formatNumber(1234.5, 'fi-FI')).toBe(`1${nbsp}234,5`)
    expect(formatArea(62, 'fi-FI')).toBe('62 m²')
  })

  it('formats euro cents as currency', () => {
    expect(formatCurrency(123450, 'en-GB')).toBe('€1,234.50')
    expect(formatCurrency(123450, 'fi-FI')).toBe(`1${nbsp}234,50${nbsp}€`)
  })

  it('formats whole percentages', () => {
    expect(formatPercent(85, 'en-GB')).toBe('85%')
    expect(formatPercent(85, 'fi-FI')).toBe(`85${nbsp}%`)
  })
})
