import { describe, expect, it } from 'vitest'
import { ConfigError, DEFAULT_GEMINI_MODEL, loadConfig } from './config.ts'

describe('configuration', () => {
  it('uses defaults when nothing is set', () => {
    const defaults = {
      port: 3000,
      host: '0.0.0.0',
      seedDemoData: false,
      geminiApiKey: null,
      geminiModel: DEFAULT_GEMINI_MODEL,
      corsOrigins: [],
      trustProxy: 0,
      writeRateLimit: 60,
      resetRateLimit: 10,
    }
    expect(loadConfig({})).toEqual(defaults)
    expect(loadConfig({ PORT: ' ', HOST: '', GEMINI_API_KEY: ' ', CORS_ORIGINS: '' })).toEqual(defaults)
  })

  it('reads the port and host from the environment', () => {
    expect(loadConfig({ PORT: '8080', HOST: '127.0.0.1' })).toMatchObject({ port: 8080, host: '127.0.0.1' })
  })

  it.each(['abc', '0', '65536', '30.5', '-1'])('rejects the port "%s" with a clear message', (port) => {
    expect(() => loadConfig({ PORT: port })).toThrow(ConfigError)
    expect(() => loadConfig({ PORT: port })).toThrow(`PORT must be a whole number from 1 to 65535, got "${port}".`)
  })

  it.each([
    ['true', true],
    [' TRUE ', true],
    ['false', false],
    ['', false],
  ])('reads SEED_DEMO_DATA=%j as %s', (value, expected) => {
    expect(loadConfig({ SEED_DEMO_DATA: value }).seedDemoData).toBe(expected)
  })

  it.each(['yes', '1', 'on'])('rejects SEED_DEMO_DATA=%j with a clear message', (value) => {
    expect(() => loadConfig({ SEED_DEMO_DATA: value })).toThrow(
      `SEED_DEMO_DATA must be "true" or "false", got "${value}".`,
    )
  })

  it('reads the Gemini settings', () => {
    expect(loadConfig({ GEMINI_API_KEY: ' key ', GEMINI_MODEL: 'gemini-x' })).toMatchObject({
      geminiApiKey: 'key',
      geminiModel: 'gemini-x',
    })
  })

  it('reads the allowed CORS origins', () => {
    expect(
      loadConfig({
        CORS_ORIGINS: 'https://jalaspace.vercel.app, https://jalaspace-*-team.vercel.app,http://localhost:5173',
      }).corsOrigins,
    ).toEqual(['https://jalaspace.vercel.app', 'https://jalaspace-*-team.vercel.app', 'http://localhost:5173'])
  })

  it.each(['jalaspace.vercel.app', 'https://jalaspace.vercel.app/', 'https://a.app/path'])(
    'rejects the CORS origin "%s"',
    (origin) => {
      expect(() => loadConfig({ CORS_ORIGINS: origin })).toThrow(ConfigError)
    },
  )

  it('reads the number of trusted proxies', () => {
    expect(loadConfig({ TRUST_PROXY: '1' }).trustProxy).toBe(1)
  })

  it.each(['true', '-1', '1.5', '11'])('rejects TRUST_PROXY=%j', (value) => {
    expect(() => loadConfig({ TRUST_PROXY: value })).toThrow(
      `TRUST_PROXY must be the number of proxies (0–10), got "${value}".`,
    )
  })

  it('reads the write and reset rate limits', () => {
    expect(loadConfig({ WRITE_RATE_LIMIT: '120', RESET_RATE_LIMIT: ' 1000 ' })).toMatchObject({
      writeRateLimit: 120,
      resetRateLimit: 1000,
    })
  })

  it.each(['0', '-5', '2.5', 'many', '1000001'])('rejects the rate limit %j', (value) => {
    expect(() => loadConfig({ WRITE_RATE_LIMIT: value })).toThrow(
      `WRITE_RATE_LIMIT must be a whole number from 1 to 1000000, got "${value}".`,
    )
    expect(() => loadConfig({ RESET_RATE_LIMIT: value })).toThrow(ConfigError)
  })
})
