/** Server settings read from environment variables. */
export interface Config {
  port: number
  host: string
  /** Start with the demo data and allow resetting it (`SEED_DEMO_DATA=true`). */
  seedDemoData: boolean
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

const DEFAULT_PORT = 3000
const DEFAULT_HOST = '0.0.0.0'

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return DEFAULT_PORT
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError(`PORT must be a whole number from 1 to 65535, got "${value}".`)
  }
  return port
}

function parseBoolean(name: string, value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (normalized === '' || normalized === 'false') return false
  if (normalized === 'true') return true
  throw new ConfigError(`${name} must be "true" or "false", got "${value}".`)
}

/** Reads the configuration, failing fast with a clear message on invalid values. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: parsePort(env.PORT),
    host: env.HOST?.trim() || DEFAULT_HOST,
    seedDemoData: parseBoolean('SEED_DEMO_DATA', env.SEED_DEMO_DATA),
  }
}
