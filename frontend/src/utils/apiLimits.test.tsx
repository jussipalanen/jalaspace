import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createDataLayer, type DataLayer } from '../repositories'
import { ApiRequestError } from '../repositories/api/apiRequest'
import { EntityNotFoundError } from '../repositories/Repository'
import { renderRoute } from '../test/renderRoute'
import { apiLimitCode } from './apiLimits'

describe('apiLimitCode', () => {
  it('recognises the API limits', () => {
    expect(apiLimitCode(new ApiRequestError(429, 'rate_limited'))).toBe('rateLimited')
    expect(apiLimitCode(new ApiRequestError(409, 'limit_reached', { limit: 50 }))).toBe('limitReached')
  })

  it('leaves other errors to the usual messages', () => {
    expect(apiLimitCode(new ApiRequestError(409, 'property_in_use'))).toBeNull()
    expect(apiLimitCode(new ApiRequestError(null, 'network'))).toBeNull()
    expect(apiLimitCode(new EntityNotFoundError('x'))).toBeNull()
    expect(apiLimitCode(new Error('boom'))).toBeNull()
  })
})

/** A data layer whose property creation fails like the API would. */
function failingCreate(error: Error): DataLayer {
  const real = createDataLayer('localStorage')
  return { ...real, properties: { ...real.properties, create: () => Promise.reject(error) } }
}

async function submitNewProperty(dataLayer: DataLayer, language?: 'fi') {
  const user = userEvent.setup()
  renderRoute('/properties/new', { dataLayer, language })
  await user.type(await screen.findByLabelText(/^(Name|Nimi)/), 'Oulu Office House')
  await user.type(screen.getByLabelText(/^(Street address|Katuosoite)/), 'Kauppurienkatu 3')
  await user.type(screen.getByLabelText(/^(Postal code|Postinumero)/), '90100')
  await user.type(screen.getByLabelText(/^(City|Postitoimipaikka)/), 'Oulu')
  await user.click(screen.getByRole('button', { name: /^(Save property|Tallenna kiinteistö)$/ }))
}

describe('save errors from API limits', () => {
  it('explains too many changes instead of the generic error', async () => {
    await submitNewProperty(failingCreate(new ApiRequestError(429, 'rate_limited')))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many changes in a short time. Wait a moment and try again.',
    )
  })

  it('explains a full shared demo, in Finnish too', async () => {
    await submitNewProperty(failingCreate(new ApiRequestError(409, 'limit_reached', { limit: 50 })), 'fi')
    expect(await screen.findByRole('alert')).toHaveTextContent('Yhteinen demo on täynnä')
  })

  it('keeps the generic message for other failures', async () => {
    await submitNewProperty(failingCreate(new ApiRequestError(500, 'internal_error')))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save the property. Please try again.')
  })
})
