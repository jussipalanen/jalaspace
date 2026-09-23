import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { Property } from '../../types/property'
import { EntityNotFoundError } from '../Repository'
import { ApiRepository } from './ApiRepository'
import { ApiRequestError } from './apiRequest'

const API_URL = 'http://api.test'

const property: Property = {
  id: 'property-1',
  name: 'Joensuu Center',
  type: 'mixed_use',
  address: 'Siltakatu 12',
  postalCode: '80100',
  city: 'Joensuu',
  description: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const apiError = (status: number, code: string, details: object = {}) => json({ error: { code, ...details } }, status)

describe('ApiRepository', () => {
  let fetchMock: Mock<typeof fetch>
  const repository = new ApiRepository<Property>(API_URL, '/properties')

  /** The method, URL and parsed body of the n-th request. */
  const request = (index = 0) => {
    const [url, init] = fetchMock.mock.calls[index]!
    return {
      method: init?.method,
      url,
      body: typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
    }
  }

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists the collection', async () => {
    fetchMock.mockResolvedValue(json([property]))

    expect(await repository.getAll()).toEqual([property])
    expect(request()).toEqual({ method: 'GET', url: `${API_URL}/api/properties`, body: undefined })
  })

  it('reads one entity, and null when it does not exist', async () => {
    fetchMock.mockResolvedValueOnce(json(property)).mockResolvedValueOnce(apiError(404, 'not_found'))

    expect(await repository.getById('property-1')).toEqual(property)
    expect(await repository.getById('missing')).toBeNull()
    expect(request(0).url).toBe(`${API_URL}/api/properties/property-1`)
  })

  it('fills in fields an older API does not return with the normalizer', async () => {
    const withDefaults = new ApiRepository(API_URL, '/properties', (entity) => ({
      ...(entity as Property),
      description: (entity as Property).description ?? 'none',
    }))
    const { description: _description, ...older } = property
    fetchMock.mockResolvedValueOnce(json([older])).mockResolvedValueOnce(json(older, 201))

    expect(await withDefaults.getAll()).toEqual([{ ...property, description: 'none' }])
    expect(await withDefaults.create(property)).toEqual({ ...property, description: 'none' })
  })

  it('encodes ids in the URL', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'not_found'))
    await repository.getById('a/b?c')
    expect(request().url).toBe(`${API_URL}/api/properties/a%2Fb%3Fc`)
  })

  it('creates an entity and returns the one the API stored, with its id', async () => {
    const stored = { ...property, id: 'server-id', createdAt: '2026-09-23T10:00:00.000Z' }
    fetchMock.mockResolvedValue(json(stored, 201))

    expect(await repository.create(property)).toEqual(stored)
    expect(request()).toEqual({ method: 'POST', url: `${API_URL}/api/properties`, body: property })
  })

  it('updates an entity and returns the API version', async () => {
    const stored = { ...property, updatedAt: '2026-09-23T10:00:00.000Z' }
    fetchMock.mockResolvedValue(json(stored))

    expect(await repository.update(property)).toEqual(stored)
    expect(request()).toEqual({ method: 'PUT', url: `${API_URL}/api/properties/property-1`, body: property })
  })

  it('reports an update of a missing entity as EntityNotFoundError', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'not_found'))
    await expect(repository.update(property)).rejects.toBeInstanceOf(EntityNotFoundError)
  })

  it('deletes an entity, and ignores one that does not exist', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(apiError(404, 'not_found'))

    await expect(repository.delete('property-1')).resolves.toBeUndefined()
    await expect(repository.delete('missing')).resolves.toBeUndefined()
    expect(request()).toMatchObject({ method: 'DELETE', url: `${API_URL}/api/properties/property-1` })
  })

  it('rejects with the API error code and details', async () => {
    fetchMock.mockResolvedValue(apiError(409, 'property_in_use', { spaceCount: 2, maintenanceCount: 0 }))

    const error = await repository.delete('property-1').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error).toMatchObject({ status: 409, code: 'property_in_use', details: { spaceCount: 2, maintenanceCount: 0 } })
  })

  it('rejects validation errors with the field codes', async () => {
    fetchMock.mockResolvedValue(apiError(400, 'validation_failed', { fields: { name: 'required' } }))
    await expect(repository.create(property)).rejects.toMatchObject({
      code: 'validation_failed',
      details: { fields: { name: 'required' } },
    })
  })

  it('rejects network failures as a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(repository.getAll()).rejects.toMatchObject({ status: null, code: 'network' })
  })

  it('rejects answers it does not understand', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ not: 'a list' }))
      .mockResolvedValueOnce(new Response('<html>Bad gateway</html>', { status: 502 }))
      .mockResolvedValueOnce(json({ name: 'no id' }))

    await expect(repository.getAll()).rejects.toMatchObject({ code: 'unexpected_response' })
    await expect(repository.getAll()).rejects.toMatchObject({ status: 502, code: 'unexpected_response' })
    await expect(repository.getById('property-1')).rejects.toMatchObject({ code: 'unexpected_response' })
  })

  it('gives up after a minute, long enough for the API to wake up', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    fetchMock.mockResolvedValue(json([]))

    await repository.getAll()

    expect(timeout).toHaveBeenCalledWith(60_000)
    expect(fetchMock.mock.calls[0]![1]?.signal).toBe(timeout.mock.results[0]!.value)
  })
})
