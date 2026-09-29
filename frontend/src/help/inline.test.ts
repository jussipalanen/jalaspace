import { describe, expect, it } from 'vitest'
import { parseInline } from './inline'

describe('parseInline', () => {
  it('returns plain text as one part', () => {
    expect(parseInline('Nothing to mark.')).toEqual([{ type: 'text', text: 'Nothing to mark.' }])
  })

  it('splits out bold names', () => {
    expect(parseInline('Select **Add task**, then **Save task**.')).toEqual([
      { type: 'text', text: 'Select ' },
      { type: 'bold', text: 'Add task' },
      { type: 'text', text: ', then ' },
      { type: 'bold', text: 'Save task' },
      { type: 'text', text: '.' },
    ])
  })

  it('handles bold at the start and end', () => {
    expect(parseInline('**Leases**')).toEqual([{ type: 'bold', text: 'Leases' }])
  })

  it('splits out links to app paths', () => {
    expect(parseInline('See [Settings](/help/settings#reset).')).toEqual([
      { type: 'text', text: 'See ' },
      { type: 'link', text: 'Settings', to: '/help/settings#reset' },
      { type: 'text', text: '.' },
    ])
  })

  it('keeps unpaired markers and links outside the app as text', () => {
    expect(parseInline('A ** B')).toEqual([{ type: 'text', text: 'A ** B' }])
    expect(parseInline('[site](https://example.com)')).toEqual([
      { type: 'text', text: '[site](https://example.com)' },
    ])
  })
})
