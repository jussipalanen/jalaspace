import { describe, expect, it } from 'vitest'
import { ConfigError, loadConfig } from './config.ts'

describe('configuration', () => {
  it('uses defaults when nothing is set', () => {
    expect(loadConfig({})).toEqual({ port: 3000, host: '0.0.0.0', seedDemoData: false })
    expect(loadConfig({ PORT: ' ', HOST: '' })).toEqual({ port: 3000, host: '0.0.0.0', seedDemoData: false })
  })

  it('reads the port and host from the environment', () => {
    expect(loadConfig({ PORT: '8080', HOST: '127.0.0.1' })).toEqual({ port: 8080, host: '127.0.0.1', seedDemoData: false })
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
})
