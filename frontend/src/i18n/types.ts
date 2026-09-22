/** A message whose wording depends on `count` (selected with Intl.PluralRules). */
export interface PluralMessage {
  one: string
  other: string
}

type IsLeaf<T> = T extends string ? true : T extends PluralMessage ? true : false

/** Dot-separated paths to every message in a dictionary, e.g. `nav.items.dashboard`. */
export type MessageKeyOf<T, Prefix extends string = ''> = {
  [K in keyof T & string]: IsLeaf<T[K]> extends true
    ? `${Prefix}${K}`
    : MessageKeyOf<T[K], `${Prefix}${K}.`>
}[keyof T & string]

export type MessageValues = Record<string, string | number>
