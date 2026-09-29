import { describe, expect, it } from 'vitest'
import { splitBold } from './inline'

describe('splitBold', () => {
  it('returns plain text as one part', () => {
    expect(splitBold('Nothing to mark.')).toEqual([{ text: 'Nothing to mark.', bold: false }])
  })

  it('splits out bold names', () => {
    expect(splitBold('Select **Add task**, then **Save task**.')).toEqual([
      { text: 'Select ', bold: false },
      { text: 'Add task', bold: true },
      { text: ', then ', bold: false },
      { text: 'Save task', bold: true },
      { text: '.', bold: false },
    ])
  })

  it('handles bold at the start and end', () => {
    expect(splitBold('**Leases**')).toEqual([{ text: 'Leases', bold: true }])
  })

  it('keeps an unpaired marker as text', () => {
    expect(splitBold('A ** B')).toEqual([{ text: 'A ** B', bold: false }])
  })
})
