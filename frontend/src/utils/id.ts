type RandomSource = Pick<Crypto, 'getRandomValues'> & Partial<Pick<Crypto, 'randomUUID'>>

/**
 * Generates a random UUID v4 for new entities.
 *
 * `crypto.randomUUID()` exists only in secure contexts (HTTPS or localhost),
 * so opening the dev server over plain HTTP on a network address would break
 * creating data. `crypto.getRandomValues()` works everywhere and gives the
 * same kind of ID.
 */
export function generateId(source: RandomSource = crypto): string {
  if (typeof source.randomUUID === 'function') return source.randomUUID()

  const bytes = source.getRandomValues(new Uint8Array(16))
  // Set the version (4) and variant (10xx) bits as RFC 9562 requires.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
