import { Router } from 'express'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app.ts'
import { ApiError } from './errors.ts'
import { serve } from './test/serve.ts'

describe('API', () => {
  it('reports its health and version', async () => {
    const base = await serve(createApp({ version: '1.2.3' }))

    const response = await fetch(`${base}/api/health`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({ status: 'ok', version: '1.2.3' })
  })

  it('uses the package version by default', async () => {
    const base = await serve(createApp())
    const { version } = (await (await fetch(`${base}/api/health`)).json()) as { version: string }
    expect(version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('does not reveal the framework', async () => {
    const base = await serve(createApp())
    const response = await fetch(`${base}/api/health`)
    expect(response.headers.get('x-powered-by')).toBeNull()
  })

  it('answers unknown routes with a not_found code', async () => {
    const base = await serve(createApp())

    for (const path of ['/api/missing', '/missing', '/api', '/docs/missing']) {
      const response = await fetch(`${base}${path}`)
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: { code: 'not_found' } })
    }
  })

  it('rejects invalid and oversized JSON bodies with codes', async () => {
    const echo = Router().post('/echo', (request, response) => {
      response.json(request.body)
    })
    const base = await serve(createApp({ routers: [echo] }))
    const post = (body: string) =>
      fetch(`${base}/api/echo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body })

    const valid = await post('{"name":"Joensuu Center"}')
    expect(await valid.json()).toEqual({ name: 'Joensuu Center' })

    const invalid = await post('{"name":')
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toEqual({ error: { code: 'invalid_json' } })

    const tooLarge = await post(JSON.stringify({ text: 'x'.repeat(200_000) }))
    expect(tooLarge.status).toBe(413)
    expect(await tooLarge.json()).toEqual({ error: { code: 'payload_too_large' } })
  })

  it('turns API errors into their status and code', async () => {
    const router = Router().get('/thing', () => {
      throw new ApiError(404, 'not_found')
    })
    const base = await serve(createApp({ routers: [router] }))

    const response = await fetch(`${base}/api/thing`)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: { code: 'not_found' } })
  })

  it('hides unexpected errors behind internal_error, without a stack trace', async () => {
    const logError = vi.fn()
    const router = Router().get('/boom', async () => {
      throw new Error('database password is hunter2')
    })
    const base = await serve(createApp({ routers: [router], logError }))

    const response = await fetch(`${base}/api/boom`)
    const text = await response.text()

    expect(response.status).toBe(500)
    expect(JSON.parse(text)).toEqual({ error: { code: 'internal_error' } })
    expect(text).not.toContain('hunter2')
    expect(logError).toHaveBeenCalledOnce()
  })
})
