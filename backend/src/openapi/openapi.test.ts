import { Router } from 'express'
import { describe, expect, it } from 'vitest'
import { parseSuggestionRequest } from '../ai/suggestions.ts'
import { createApp } from '../app.ts'
import { FIELD_ERROR_CODES } from '../domain/common.ts'
import { parseLeaseInput } from '../domain/leases.ts'
import { parseMaintenanceInput } from '../domain/maintenance.ts'
import { parsePropertyInput } from '../domain/properties.ts'
import { parseSpaceInput } from '../domain/spaces.ts'
import { parseTenantInput } from '../domain/tenants.ts'
import { ERROR_CODES } from '../errors.ts'
import { DOCS_CSP } from '../routes/docs.ts'
import { serve } from '../test/serve.ts'
import { EXAMPLES, OPERATIONS, type OpenApiDocument } from './document.ts'

async function fetchDocument(options: Parameters<typeof createApp>[0] = { demoData: true }) {
  const base = await serve(createApp(options))
  const response = await fetch(`${base}/docs/openapi.json`)
  expect(response.status).toBe(200)
  return (await response.json()) as OpenApiDocument
}

const operationsOf = (document: OpenApiDocument) =>
  Object.entries(document.paths).flatMap(([path, item]) =>
    Object.entries(item).map(([method, operation]) => ({ key: `${method} ${path}`, operation })),
  )

describe('OpenAPI description', () => {
  it('documents every route the API has, and only those', async () => {
    const document = await fetchDocument()
    const documented = operationsOf(document)

    expect(documented.filter(({ operation }) => operation['x-undocumented']).map(({ key }) => key)).toEqual([])
    expect(documented.map(({ key }) => key).toSorted()).toEqual(Object.keys(OPERATIONS).toSorted())
  })

  it('marks a new route without documentation, so this test fails for it', async () => {
    const extra = Router().get('/reports', (_request, response) => {
      response.json([])
    })
    const document = await fetchDocument({ routers: [extra] })

    expect(document.paths['/api/reports']?.get).toMatchObject({ 'x-undocumented': true })
  })

  it('lists the demo reset only when the demo data is enabled', async () => {
    expect((await fetchDocument({ demoData: true })).paths['/api/demo/reset']).toBeDefined()
    expect((await fetchDocument({ demoData: false })).paths['/api/demo/reset']).toBeUndefined()
  })

  it('is OpenAPI 3.1 with the API version and path parameters', async () => {
    const document = await fetchDocument({ demoData: true, version: '9.9.9' })

    expect(document.openapi).toBe('3.1.0')
    expect(document.info.version).toBe('9.9.9')
    expect(document.paths['/api/units/{id}']?.put).toMatchObject({
      parameters: [{ name: 'id', in: 'path', required: true }],
    })
  })

  it('resolves every schema reference', async () => {
    const document = await fetchDocument()
    const refs = [...JSON.stringify(document).matchAll(/"\$ref":"#\/components\/schemas\/(\w+)"/g)].map(([, name]) => name)

    expect(refs.length).toBeGreaterThan(20)
    for (const name of new Set(refs)) expect(document.components.schemas, name).toHaveProperty(name!)
  })

  it('shows every error code in an example and every field error code in the schema', async () => {
    const document = await fetchDocument()
    const shownCodes = new Set(
      [...JSON.stringify(document.paths).matchAll(/"error":\{"code":"(\w+)"/g)].map(([, code]) => code),
    )

    for (const code of ERROR_CODES) expect(shownCodes, code).toContain(code)
    expect(document.components.schemas.FieldErrors).toMatchObject({
      additionalProperties: { enum: [...FIELD_ERROR_CODES] },
    })
  })

  it('takes allowed values and limits from the domain rules', async () => {
    const { components } = await fetchDocument()
    const properties = (name: string) => (components.schemas[name] as { properties: Record<string, object> }).properties

    expect(properties('PropertyInput').type).toMatchObject({
      enum: ['office', 'retail', 'industrial', 'residential', 'mixed_use'],
    })
    expect(properties('PropertyInput').postalCode).toMatchObject({ pattern: '^\\d{5}$' })
    expect(properties('SpaceInput').floor).toMatchObject({ minimum: -10, maximum: 200 })
    expect(properties('LeaseInput').monthlyRentCents).toMatchObject({ maximum: 100_000_000 })
    expect(properties('MaintenanceTask').completedAt).toMatchObject({ readOnly: true })
  })

  it('has request examples that the API itself accepts', () => {
    const parsers = {
      PropertyInput: parsePropertyInput,
      SpaceInput: parseSpaceInput,
      MaintenanceTaskInput: parseMaintenanceInput,
      TenantInput: parseTenantInput,
      LeaseInput: parseLeaseInput,
      SuggestionRequest: parseSuggestionRequest,
    }
    for (const [name, parse] of Object.entries(parsers)) {
      expect(parse(EXAMPLES[name as keyof typeof EXAMPLES]), name).toMatchObject({ ok: true })
    }
  })
})

describe('docs pages', () => {
  it('serves Swagger UI with a strict content security policy', async () => {
    const base = await serve(createApp())
    const response = await fetch(`${base}/docs`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toMatch(/^text\/html/)
    expect(response.headers.get('content-security-policy')).toBe(DOCS_CSP)
    expect(DOCS_CSP).not.toMatch(/script-src[^;]*'unsafe-inline'/)
    const html = await response.text()
    expect(html).toMatch(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/swagger-ui-dist@[\d.]+\/swagger-ui-bundle\.js" integrity="sha384-/)
    expect(html).not.toMatch(/<script>/)

    const init = await fetch(`${base}/docs/swagger-init.js`)
    expect(init.headers.get('content-type')).toMatch(/javascript/)
    expect(await init.text()).toContain("url: '/docs/openapi.json'")
  })

  it('redirects the server root to the docs', async () => {
    const base = await serve(createApp())
    const response = await fetch(`${base}/`, { redirect: 'manual' })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/docs')
  })
})
