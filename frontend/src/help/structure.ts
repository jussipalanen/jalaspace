import type { MessageKey } from '../i18n/translate'

/**
 * The handbook's chapters and their sections, in reading order. Chapter ids
 * are URL segments (`/help/maintenance`) and section ids are anchors
 * (`/help/maintenance#status`), the same in every language.
 */
export const HANDBOOK_STRUCTURE = {
  'getting-started': ['sign-in', 'navigation', 'language', 'demo-data'],
  dashboard: ['key-figures', 'lists', 'ask'],
  properties: ['list', 'details', 'add-edit', 'location', 'delete'],
  spaces: ['list', 'add-edit', 'status', 'delete'],
  maintenance: ['list', 'add', 'ai', 'status', 'delete'],
  applications: ['list', 'review', 'approve', 'public-form'],
  tenants: ['list', 'add', 'spaces', 'delete'],
  leases: ['list', 'create', 'status', 'edit'],
  settings: ['profile', 'language', 'reset'],
  walkthroughs: ['application-to-lease', 'maintenance-task', 'new-property'],
} as const

export type ChapterId = keyof typeof HANDBOOK_STRUCTURE

export type SectionId<C extends ChapterId = ChapterId> = (typeof HANDBOOK_STRUCTURE)[C][number]

export const CHAPTER_IDS = Object.keys(HANDBOOK_STRUCTURE) as ChapterId[]

export function isChapterId(value: unknown): value is ChapterId {
  return typeof value === 'string' && Object.hasOwn(HANDBOOK_STRUCTURE, value)
}

export function sectionIds<C extends ChapterId>(chapter: C): readonly SectionId<C>[] {
  return HANDBOOK_STRUCTURE[chapter]
}

/** The table of contents, grouped like the sidebar. */
export const CHAPTER_GROUPS: { titleKey: MessageKey; chapters: ChapterId[] }[] = [
  { titleKey: 'nav.sections.overview', chapters: ['getting-started', 'dashboard'] },
  { titleKey: 'nav.sections.portfolio', chapters: ['properties', 'spaces'] },
  { titleKey: 'nav.sections.operations', chapters: ['maintenance'] },
  { titleKey: 'nav.sections.leasing', chapters: ['applications', 'tenants', 'leases'] },
  { titleKey: 'help.groups.more', chapters: ['settings', 'walkthroughs'] },
]

/** Where a route's help is: a chapter, and optionally a section of it. */
export interface HelpTarget {
  chapter: ChapterId
  section?: SectionId
}

/** The handbook link for a help target; no target opens the table of contents. */
export function helpPath(target?: HelpTarget | null): string {
  if (!target) return '/help'
  return `/help/${target.chapter}${target.section ? `#${target.section}` : ''}`
}
