import { describe, expect, it } from 'vitest'
import { createApp } from './app.ts'
import { serve } from './test/serve.ts'

const allowed = ['https://jalaspace.vercel.app', 'https://jalaspace-*-team.vercel.app', 'http://localhost:5173']

describe('CORS', () => {
  it.each([
    'https://jalaspace.vercel.app',
    'https://jalaspace-git-feature-x-team.vercel.app',
    'http://localhost:5173',
  ])('lets %s call the API', async (origin) => {
    const base = await serve(createApp({ corsOrigins: allowed }))

    const response = await fetch(`${base}/api/health`, { headers: { origin } })

    expect(response.headers.get('access-control-allow-origin')).toBe(origin)
    expect(response.headers.get('vary')).toContain('Origin')
  })

  it.each([
    'https://evil.example',
    'https://jalaspace.vercel.app.evil.example',
    'https://jalaspace-x.evil-team.vercel.app',
    'http://localhost:5174',
  ])('gives %s no CORS headers', async (origin) => {
    const base = await serve(createApp({ corsOrigins: allowed }))

    const response = await fetch(`${base}/api/health`, { headers: { origin } })

    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('answers preflight requests from allowed origins', async () => {
    const base = await serve(createApp({ corsOrigins: allowed }))

    const response = await fetch(`${base}/api/maintenance/suggestions`, {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    })

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
    expect(response.headers.get('access-control-allow-methods')).toContain('POST')
    expect(response.headers.get('access-control-allow-headers')).toBe('Content-Type')
  })

  it('allows no origins by default', async () => {
    const base = await serve(createApp())
    const response = await fetch(`${base}/api/health`, { headers: { origin: 'http://localhost:5173' } })
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
  })
})
