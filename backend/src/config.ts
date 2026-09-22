/** Server settings read from environment variables. */
export interface Config {
  port: number
  host: string
  /** Start with the demo data and allow resetting it (`SEED_DEMO_DATA=true`). */
  seedDemoData: boolean
  /** Gemini API key; `null` turns the AI suggestions off. A secret: never log it. */
  geminiApiKey: string | null
  geminiModel: string
  /** Origins allowed to call the API from a browser; `*` matches one host label part. */
  corsOrigins: string[]
  /** Number of proxies in front of the API (Render: 1), so the client IP is read correctly. */
  trustProxy: number
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

const DEFAULT_PORT = 3000
const DEFAULT_HOST = '0.0.0.0'
/** A low-cost, stable model that is available on the Gemini API free tier. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite'

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

function parseTrustProxy(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return 0
  const hops = Number(value)
  if (!Number.isInteger(hops) || hops < 0 || hops > 10) {
    throw new ConfigError(`TRUST_PROXY must be the number of proxies (0–10), got "${value}".`)
  }
  return hops
}

function parseOrigins(value: string | undefined): string[] {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  for (const origin of origins) {
    if (!/^https?:\/\/[a-z0-9.*-]+(:\d+)?$/i.test(origin)) {
      throw new ConfigError(
        `CORS_ORIGINS must list origins such as https://jalaspace.vercel.app, got "${origin}".`,
      )
    }
  }
  return origins
}

/** Reads the configuration, failing fast with a clear message on invalid values. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: parsePort(env.PORT),
    host: env.HOST?.trim() || DEFAULT_HOST,
    seedDemoData: parseBoolean('SEED_DEMO_DATA', env.SEED_DEMO_DATA),
    geminiApiKey: env.GEMINI_API_KEY?.trim() || null,
    geminiModel: env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    corsOrigins: parseOrigins(env.CORS_ORIGINS),
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
  }
}
