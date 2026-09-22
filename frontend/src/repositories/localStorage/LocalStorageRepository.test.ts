import { describe, expect, it } from 'vitest'
import type { Property } from '../../types/property'
import { DuplicateEntityError, EntityNotFoundError } from '../Repository'
import { STORAGE_KEYS } from './keys'
import { LocalStorageRepository } from './LocalStorageRepository'

const KEY = STORAGE_KEYS.properties

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: crypto.randomUUID(),
    name: 'Joensuu Center',
    address: 'Siltakatu 12',
    postalCode: '80100',
    city: 'Joensuu',
    type: 'mixed_use',
    description: '',
    createdAt: '2026-09-22T10:30:00.000Z',
    updatedAt: '2026-09-22T10:30:00.000Z',
    ...overrides,
  }
}

describe('LocalStorageRepository', () => {
  it('starts empty', async () => {
    const repository = new LocalStorageRepository<Property>(KEY)
    expect(await repository.getAll()).toEqual([])
    expect(await repository.getById('missing')).toBeNull()
  })

  it('creates a property that survives a new repository instance (page refresh)', async () => {
    const property = makeProperty()
    await new LocalStorageRepository<Property>(KEY).create(property)

    const reloaded = new LocalStorageRepository<Property>(KEY)
    expect(await reloaded.getAll()).toEqual([property])
    expect(await reloaded.getById(property.id)).toEqual(property)
    expect(window.localStorage.getItem(KEY)).toContain(property.id)
  })

  it('keeps entities in creation order', async () => {
    const repository = new LocalStorageRepository<Property>(KEY)
    const first = await repository.create(makeProperty({ name: 'First' }))
    const second = await repository.create(makeProperty({ name: 'Second' }))

    expect((await repository.getAll()).map((p) => p.id)).toEqual([first.id, second.id])
  })

  it('rejects a duplicate id', async () => {
    const repository = new LocalStorageRepository<Property>(KEY)
    const property = await repository.create(makeProperty())

    await expect(repository.create(property)).rejects.toBeInstanceOf(DuplicateEntityError)
    expect(await repository.getAll()).toHaveLength(1)
  })

  it('updates an existing entity in place', async () => {
    const repository = new LocalStorageRepository<Property>(KEY)
    const first = await repository.create(makeProperty({ name: 'First' }))
    const second = await repository.create(makeProperty({ name: 'Second' }))

    await repository.update({ ...first, name: 'Renamed' })

    expect((await repository.getAll()).map((p) => p.name)).toEqual(['Renamed', 'Second'])
    expect(await repository.getById(second.id)).toEqual(second)
  })

  it('rejects updating a missing entity', async () => {
    const repository = new LocalStorageRepository<Property>(KEY)
    await expect(repository.update(makeProperty())).rejects.toBeInstanceOf(EntityNotFoundError)
  })

  it('deletes an entity, and ignores unknown ids', async () => {
    const repository = new LocalStorageRepository<Property>(KEY)
    const keep = await repository.create(makeProperty())
    const remove = await repository.create(makeProperty())

    await repository.delete(remove.id)
    await repository.delete('does-not-exist')

    expect(await repository.getAll()).toEqual([keep])
  })

  it('does not share data between keys', async () => {
    await new LocalStorageRepository<Property>(KEY).create(makeProperty())
    expect(await new LocalStorageRepository<Property>(STORAGE_KEYS.tenants).getAll()).toEqual([])
  })

  it.each([
    ['corrupt JSON', '{not json'],
    ['a non-array value', JSON.stringify({ id: 'x' })],
  ])('reads %s as an empty collection', async (_, raw) => {
    window.localStorage.setItem(KEY, raw)
    expect(await new LocalStorageRepository<Property>(KEY).getAll()).toEqual([])
  })

  it('skips stored items without an id', async () => {
    const valid = makeProperty()
    window.localStorage.setItem(KEY, JSON.stringify([valid, { name: 'no id' }, null]))

    expect(await new LocalStorageRepository<Property>(KEY).getAll()).toEqual([valid])
  })
})
