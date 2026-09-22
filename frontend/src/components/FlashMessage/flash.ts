/**
 * A one-time success message passed with navigation, e.g.
 * `navigate('/properties', { state: flashState('Property X was deleted.') })`.
 */
export interface Flash {
  message: string
}

export function flashState(message: string): { flash: Flash } {
  return { flash: { message } }
}

export function readFlash(state: unknown): Flash | null {
  if (typeof state !== 'object' || state === null) return null
  const flash = (state as { flash?: unknown }).flash
  if (typeof flash !== 'object' || flash === null) return null
  const message = (flash as { message?: unknown }).message
  return typeof message === 'string' ? { message } : null
}
