import type { ChapterId, SectionId } from './structure'

/**
 * Handbook text. `**Bold**` marks the name of a button, field or page as it
 * appears in the app; no other formatting is supported.
 */
export type HelpText = string

export type HelpBlock =
  | { type: 'paragraph'; text: HelpText }
  /** Numbered steps to follow in order. */
  | { type: 'steps'; items: HelpText[] }
  | { type: 'list'; items: HelpText[] }
  /** A tip or a caution, set apart from the text. */
  | { type: 'note'; text: HelpText }
  /** A link into the app, e.g. "Open Maintenance". `to` is an app path. */
  | { type: 'link'; to: string; label: string }

export interface HelpSection {
  title: string
  blocks: HelpBlock[]
}

export interface HelpChapter<C extends ChapterId = ChapterId> {
  title: string
  /** One sentence for the table of contents. */
  summary: string
  sections: Record<SectionId<C>, HelpSection>
}

/** The whole handbook in one language: every chapter and section is required. */
export type Handbook = { [C in ChapterId]: HelpChapter<C> }
