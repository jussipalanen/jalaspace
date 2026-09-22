import { describe, expect, it } from 'vitest'
import { MemoryCollection } from './memoryStore.ts'

interface Item {
  id: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

const item = (id: string): Item => ({ id, createdAt: '', updatedAt: '', tags: ['a'] })

describe('in-memory collection', () => {
  it('stores, updates and deletes entities in insertion order', async () => {
    const collection = new MemoryCollection<Item>()
    await collection.insert(item('b'))
    await collection.insert(item('a'))

    expect((await collection.list()).map(({ id }) => id)).toEqual(['b', 'a'])
    expect(await collection.update({ ...item('a'), tags: ['z'] })).toEqual({ ...item('a'), tags: ['z'] })
    expect(await collection.get('a')).toEqual({ ...item('a'), tags: ['z'] })
    expect(await collection.delete('a')).toBe(true)
    expect(await collection.get('a')).toBeNull()
  })

  it('reports missing entities instead of creating them', async () => {
    const collection = new MemoryCollection<Item>()
    expect(await collection.update(item('missing'))).toBeNull()
    expect(await collection.delete('missing')).toBe(false)
    expect(await collection.list()).toEqual([])
  })

  it('refuses a duplicate id', async () => {
    const collection = new MemoryCollection<Item>()
    await collection.insert(item('a'))
    await expect(collection.insert(item('a'))).rejects.toThrow('Duplicate id a')
  })

  it('returns copies, so callers cannot change stored data', async () => {
    const collection = new MemoryCollection<Item>()
    const original = item('a')
    await collection.insert(original)
    original.tags.push('changed')
    ;(await collection.get('a'))!.tags.push('changed')
    ;(await collection.list())[0]!.tags.push('changed')

    expect(await collection.get('a')).toEqual(item('a'))
  })
})
