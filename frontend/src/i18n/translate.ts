import { en, type Messages } from './locales/en'
import type { MessageKeyOf, MessageValues, PluralMessage } from './types'

export type MessageKey = MessageKeyOf<Messages>

export type Translate = (key: MessageKey, values?: MessageValues) => string

function lookup(messages: unknown, key: string): string | PluralMessage | undefined {
  let node: unknown = messages
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = (node as Record<string, unknown>)[part]
  }
  if (typeof node === 'string') return node
  if (typeof node === 'object' && node !== null && 'one' in node && 'other' in node) {
    return node as PluralMessage
  }
  return undefined
}

/**
 * Creates `t(key, values)` for one language. Missing messages fall back to
 * English, then to the key itself. Numbers in `values` are formatted for
 * the locale; plural messages are chosen by `values.count`.
 */
export function createTranslator(
  messages: Messages,
  locale: string,
  fallback: Messages = en,
): Translate {
  const pluralRules = new Intl.PluralRules(locale)
  const numberFormat = new Intl.NumberFormat(locale)

  return (key, values) => {
    let message = lookup(messages, key)
    if (message === undefined) {
      if (import.meta.env.DEV) console.warn(`Missing translation "${key}" for ${locale}`)
      message = lookup(fallback, key)
    }
    if (message === undefined) return key

    const template =
      typeof message === 'string'
        ? message
        : pluralRules.select(Number(values?.count ?? 0)) === 'one'
          ? message.one
          : message.other

    return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
      const value = values?.[name]
      if (value === undefined) return placeholder
      return typeof value === 'number' ? numberFormat.format(value) : value
    })
  }
}
