import { matchRoutes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../i18n/languages'
import { en as enUi } from '../i18n/locales/en'
import { fi as fiUi } from '../i18n/locales/fi'
import { routes } from '../router'
import { en } from './content/en'
import { fi } from './content/fi'
import { parseInline } from './inline'
import { CHAPTER_GROUPS, CHAPTER_IDS, HANDBOOK_STRUCTURE, helpPath, isChapterId, sectionIds } from './structure'
import type { Handbook, HelpBlock } from './types'

const handbooks: Record<(typeof SUPPORTED_LANGUAGES)[number], Handbook> = { en, fi }
const uiMessages: Record<(typeof SUPPORTED_LANGUAGES)[number], unknown> = { en: enUi, fi: fiUi }

/** Every text of a UI dictionary without its `{placeholders}`, e.g. "Open in" from "Open in {page}". */
function uiLabels(messages: unknown): Set<string> {
  const leaves = (node: unknown): string[] =>
    typeof node === 'string' ? [node] : Object.values(node as object).flatMap(leaves)
  return new Set(leaves(messages).map((text) => text.replace(/\{\w+\}/g, '').trim()))
}

/** Bold names that are not UI text: the header's help button shows only an icon. */
const NON_UI_NAMES = new Set(['?'])

/** Every text of a handbook, with where it is, for helpful failure messages. */
function texts(handbook: Handbook): { where: string; text: string }[] {
  const result: { where: string; text: string }[] = []
  for (const chapterId of CHAPTER_IDS) {
    const chapter = handbook[chapterId]
    result.push({ where: `${chapterId}.title`, text: chapter.title })
    result.push({ where: `${chapterId}.summary`, text: chapter.summary })
    for (const [sectionId, section] of Object.entries(chapter.sections)) {
      const where = `${chapterId}#${sectionId}`
      result.push({ where: `${where}.title`, text: section.title })
      for (const block of section.blocks as HelpBlock[]) {
        if (block.type === 'steps' || block.type === 'list') {
          block.items.forEach((item) => result.push({ where, text: item }))
        } else if (block.type === 'link') {
          result.push({ where, text: block.label })
        } else {
          result.push({ where, text: block.text })
        }
      }
    }
  }
  return result
}

/** Every app path the handbook links to: link blocks and `[links](/path)` in the text. */
function appLinks(handbook: Handbook): string[] {
  const inline = texts(handbook).flatMap(({ text }) =>
    parseInline(text).flatMap((part) => (part.type === 'link' ? [part.to] : [])),
  )
  const blocks = CHAPTER_IDS.flatMap((chapterId) =>
    Object.values(handbook[chapterId].sections).flatMap((section) =>
      (section.blocks as HelpBlock[]).flatMap((block) => (block.type === 'link' ? [block.to] : [])),
    ),
  )
  return [...blocks, ...inline]
}

/** A handbook link must name a real chapter, and its anchor a real section of it. */
function isValidHelpLink(to: string): boolean {
  const [path, section] = to.split('#')
  const chapter = path.slice('/help/'.length)
  if (!isChapterId(chapter)) return false
  return section === undefined || (sectionIds(chapter) as readonly string[]).includes(section)
}

describe.each(SUPPORTED_LANGUAGES)('handbook in %s', (language) => {
  const handbook = handbooks[language]

  it('has every chapter and section in the order of the structure', () => {
    expect(Object.keys(handbook)).toEqual(CHAPTER_IDS)
    for (const chapterId of CHAPTER_IDS) {
      expect(Object.keys(handbook[chapterId].sections), chapterId).toEqual(HANDBOOK_STRUCTURE[chapterId])
    }
  })

  it('has no empty texts, sections or lists', () => {
    for (const { where, text } of texts(handbook)) {
      expect(text.trim(), where).not.toBe('')
    }
    for (const chapterId of CHAPTER_IDS) {
      for (const [sectionId, section] of Object.entries(handbook[chapterId].sections)) {
        const blocks = section.blocks as HelpBlock[]
        expect(blocks.length, `${chapterId}#${sectionId}`).toBeGreaterThan(0)
        for (const block of blocks) {
          if (block.type === 'steps' || block.type === 'list') {
            expect(block.items.length, `${chapterId}#${sectionId}`).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('pairs every ** that marks a bold name and writes links completely', () => {
    for (const { where, text } of texts(handbook)) {
      const plain = parseInline(text)
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('')
      expect(plain, where).not.toContain('**')
      expect(plain, where).not.toMatch(/\]\(/)
    }
  })

  // Users look for the exact word on the screen, so a bold name is never inflected or reworded.
  it('writes bold names exactly as the UI shows them', () => {
    const labels = uiLabels(uiMessages[language])
    for (const { where, text } of texts(handbook)) {
      for (const part of parseInline(text)) {
        if (part.type !== 'bold' || NON_UI_NAMES.has(part.text)) continue
        expect(labels.has(part.text), `${where}: **${part.text}**`).toBe(true)
      }
    }
  })

  it('links only to pages of the app', () => {
    const links = appLinks(handbook)
    expect(links.length).toBeGreaterThan(0)
    for (const to of links) {
      const matched = matchRoutes(routes, to.split('#')[0])?.at(-1)?.route.path
      expect(matched, to).toBeDefined()
      expect(matched, to).not.toBe('*')
      if (to.startsWith('/help/')) expect(isValidHelpLink(to), to).toBe(true)
    }
  })
})

describe('handbook structure', () => {
  it('lists every chapter exactly once in the table of contents, in reading order', () => {
    expect(CHAPTER_GROUPS.flatMap((group) => group.chapters)).toEqual(CHAPTER_IDS)
  })

  it('links the same pages in both languages', () => {
    expect(appLinks(fi)).toEqual(appLinks(en))
  })

  it('translates every text into Finnish', () => {
    const english = texts(en)
    const finnish = texts(fi)
    const untranslated = finnish.filter(({ text }, index) => text === english[index]?.text)
    expect(untranslated).toEqual([])
  })

  it('builds handbook links', () => {
    expect(helpPath(null)).toBe('/help')
    expect(helpPath({ chapter: 'maintenance' })).toBe('/help/maintenance')
    expect(helpPath({ chapter: 'maintenance', section: 'status' })).toBe('/help/maintenance#status')
  })

  it('recognises chapter ids', () => {
    expect(isChapterId('leases')).toBe(true)
    expect(isChapterId('toString')).toBe(false)
    expect(isChapterId(undefined)).toBe(false)
  })
})
