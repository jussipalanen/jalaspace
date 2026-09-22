import { describe, expect, it } from 'vitest'
import { createMemoryStore } from '../store/memoryStore.ts'
import { createDemoData, resetDemoData } from './demoData.ts'
import { parsePropertyInput } from './properties.ts'

const now = new Date('2026-09-22T10:30:00.000Z')

describe('demo data', () => {
  it('has the four demo properties with the same ids as the frontend seed', () => {
    expect(createDemoData(now).properties.map(({ id }) => id)).toEqual([
      'property-joensuu-center',
      'property-kuopio-harbour',
      'property-tampere-hervanta',
      'property-helsinki-kallio',
    ])
  })

  it('dates the properties relative to now', () => {
    const [joensuu] = createDemoData(now).properties
    expect(joensuu).toMatchObject({
      createdAt: '2024-10-02T10:30:00.000Z',
      updatedAt: '2024-10-02T10:30:00.000Z',
    })
  })

  it('passes the same validation as data sent by clients', () => {
    for (const property of createDemoData(now).properties) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = property
      expect(parsePropertyInput(input)).toEqual({ ok: true, values: input })
    }
  })

  it('replaces all data with the demo data on reset', async () => {
    const store = createMemoryStore()
    await store.properties.insert({ ...createDemoData(now).properties[0]!, id: 'mine', name: 'Mine' })
    await store.spaces.insert({ id: 'space-1', propertyId: 'mine', createdAt: '', updatedAt: '' })
    await store.maintenance.insert({ id: 'task-1', propertyId: 'mine', createdAt: '', updatedAt: '' })

    await resetDemoData(store, now)

    expect(await store.properties.list()).toEqual(createDemoData(now).properties)
    expect(await store.spaces.list()).toEqual([])
    expect(await store.maintenance.list()).toEqual([])
  })
})
