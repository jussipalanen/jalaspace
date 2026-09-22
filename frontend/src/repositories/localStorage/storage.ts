/**
 * Safe JSON helpers around localStorage. Storage can be unavailable
 * (e.g. blocked by browser settings) or contain corrupt data; neither
 * should crash the application.
 */
export function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`Unable to read "${key}" from localStorage`, error)
    return null
  }
}

export function writeJson(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeItem(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`Unable to remove "${key}" from localStorage`, error)
  }
}
