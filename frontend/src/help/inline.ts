import type { HelpText } from './types'

export interface TextPart {
  text: string
  bold: boolean
}

/** Splits handbook text into plain and `**bold**` parts. Unpaired `**` stays as text. */
export function splitBold(text: HelpText): TextPart[] {
  const parts: TextPart[] = []
  let last = 0
  for (const match of text.matchAll(/\*\*(.+?)\*\*/g)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), bold: false })
    parts.push({ text: match[1], bold: true })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), bold: false })
  return parts
}
