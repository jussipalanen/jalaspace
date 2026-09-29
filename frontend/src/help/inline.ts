import type { HelpText } from './types'

export type TextPart =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  /** A link to an app path, e.g. another handbook chapter. */
  | { type: 'link'; text: string; to: string }

// `**bold**`, or `[label](/app/path)`; links must point inside the app.
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\((\/[^)\s]*)\)/g

/** Splits handbook text into plain text, `**bold**` names and `[links](/path)`. Anything unpaired stays as text. */
export function parseInline(text: HelpText): TextPart[] {
  const parts: TextPart[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) parts.push({ type: 'text', text: text.slice(last, match.index) })
    if (match[1] !== undefined) parts.push({ type: 'bold', text: match[1] })
    else parts.push({ type: 'link', text: match[2], to: match[3] })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) })
  return parts
}
