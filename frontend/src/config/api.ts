/**
 * Base URL of the JalaSpace API from `VITE_API_URL`, without a trailing
 * slash; `null` when not set, which turns off features that need the API.
 * Read on every call, so tests can change it.
 */
export function getApiUrl(): string | null {
  const url = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')
  return url || null
}
