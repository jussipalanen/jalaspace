import { describe, expect, it, vi } from 'vitest'
import { generateId } from './id'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('generateId', () => {
  it('uses crypto.randomUUID when it is available', () => {
    const randomUUID = vi.fn(() => '2f46a796-8488-470f-ac25-35fac8ea31da' as const)
    const source = { randomUUID, getRandomValues: crypto.getRandomValues.bind(crypto) }

    expect(generateId(source)).toBe('2f46a796-8488-470f-ac25-35fac8ea31da')
    expect(randomUUID).toHaveBeenCalledOnce()
  })

  it('falls back to getRandomValues outside secure contexts', () => {
    // Like a page opened over http:// on a network address.
    const source = { getRandomValues: crypto.getRandomValues.bind(crypto) }

    const ids = Array.from({ length: 200 }, () => generateId(source))

    for (const id of ids) expect(id).toMatch(UUID_V4)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('sets the version and variant bits even when all random bytes are 0xff', () => {
    const source = {
      getRandomValues: <T extends ArrayBufferView | null>(array: T) => {
        if (array instanceof Uint8Array) array.fill(0xff)
        return array
      },
    }

    expect(generateId(source)).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')
  })

  it('generates valid UUIDs by default', () => {
    expect(generateId()).toMatch(UUID_V4)
  })
})
