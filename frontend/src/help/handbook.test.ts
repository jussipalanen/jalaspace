import { matchRoutes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../i18n/languages'
import { routes } from '../router'
import { en } from './content/en'
import { fi } from './content/fi'
import { splitBold } from './inline'
import { CHAPTER_GROUPS, CHAPTER_IDS, HANDBOOK_STRUCTURE, helpPath, isChapterId } from './structure'
import type { Handbook, HelpBlock } from './types'

const handbooks: Record<(typeof SUPPORTED_LANGUAGES)[number], Handbook> = { en, fi }

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

function appLinks(handbook: Handbook): string[] {
  return CHAPTER_IDS.flatMap((chapterId) =>
    Object.values(handbook[chapterId].sections).flatMap((section) =>
      (section.blocks as HelpBlock[]).flatMap((block) => (block.type === 'link' ? [block.to] : [])),
    ),
  )
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

  it('pairs every ** that marks a bold name', () => {
    for (const { where, text } of texts(handbook)) {
      const plain = splitBold(text)
        .filter((part) => !part.bold)
        .map((part) => part.text)
        .join('')
      expect(plain, where).not.toContain('**')
    }
  })

  it('links only to pages of the app', () => {
    const links = appLinks(handbook)
    expect(links.length).toBeGreaterThan(0)
    for (const to of links) {
      const matched = matchRoutes(routes, to)?.at(-1)?.route.path
      expect(matched, to).toBeDefined()
      expect(matched, to).not.toBe('*')
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
