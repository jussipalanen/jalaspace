export const DATA_PROVIDERS = ['localStorage', 'api'] as const

export type DataProvider = (typeof DATA_PROVIDERS)[number]

export const DEFAULT_DATA_PROVIDER: DataProvider = 'localStorage'

function isDataProvider(value: string): value is DataProvider {
  return (DATA_PROVIDERS as readonly string[]).includes(value)
}

/** Parses `VITE_DATA_PROVIDER`; unset or empty means the default provider. */
export function parseDataProvider(value: string | undefined): DataProvider {
  const trimmed = value?.trim()
  if (!trimmed) return DEFAULT_DATA_PROVIDER
  if (isDataProvider(trimmed)) return trimmed

  throw new Error(
    `Unknown VITE_DATA_PROVIDER "${trimmed}". Expected one of: ${DATA_PROVIDERS.join(', ')}.`,
  )
}

export function getDataProvider(): DataProvider {
  return parseDataProvider(import.meta.env.VITE_DATA_PROVIDER)
}
