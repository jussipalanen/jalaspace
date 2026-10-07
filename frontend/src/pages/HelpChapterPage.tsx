import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { HelpBlocks } from '../features/help/HelpBlocks'
import { useHandbook } from '../features/help/useHandbook'
import { CHAPTER_IDS, isChapterId, sectionIds, type ChapterId } from '../help/structure'
import type { Handbook, HelpSection } from '../help/types'
import { useTranslation } from '../i18n/useTranslation'
import './HelpPage.css'

export function HelpChapterPage() {
  const { chapter } = useParams()
  return isChapterId(chapter) ? <Chapter id={chapter} /> : <ChapterNotFound />
}

function ChapterNotFound() {
  const { t } = useTranslation()
  return (
    <EmptyState headingLevel="h1" title={t('help.notFound.title')} description={t('help.notFound.description')}>
      <Link to="/help" className="button button--primary">
        {t('help.notFound.back')}
      </Link>
    </EmptyState>
  )
}

function Chapter({ id }: { id: ChapterId }) {
  const { t } = useTranslation()
  const handbook = useHandbook()
  const { hash } = useLocation()
  const loaded = handbook.status === 'success'

  // A link such as /help/maintenance#status opens at its section; another chapter opens at the top.
  useEffect(() => {
    if (!loaded) return
    const section = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (section) section.scrollIntoView?.()
    else if (document.scrollingElement) document.scrollingElement.scrollTop = 0
  }, [id, hash, loaded])

  if (handbook.status === 'loading') return <LoadingState label={t('help.loading')} />
  if (handbook.status === 'error') return <ErrorState message={t('help.loadError')} onRetry={handbook.reload} />

  const chapter = handbook.data[id]
  // Typed per chapter in the content files; read here as plain sections.
  const sections = chapter.sections as Record<string, HelpSection>
  const index = CHAPTER_IDS.indexOf(id)

  return (
    <article className="help-chapter">
      <Link to="/help" className="help-chapter__back">
        <ChevronLeftIcon width={16} height={16} />
        {t('help.allChapters')}
      </Link>
      <p className="help-chapter__number">
        {t('help.chapterNumber', { number: index + 1, count: CHAPTER_IDS.length })}
      </p>
      <PageHeader title={chapter.title} description={chapter.summary} />

      <nav className="card help-toc" aria-labelledby="help-toc-title">
        <h2 id="help-toc-title" className="help-toc__title">
          {t('help.inThisChapter')}
        </h2>
        <ul className="help-toc__list">
          {sectionIds(id).map((sectionId) => (
            <li key={sectionId}>
              <a href={`#${sectionId}`}>{sections[sectionId].title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="card help-chapter__body">
        {sectionIds(id).map((sectionId) => (
          <section key={sectionId} id={sectionId} className="help-section" aria-labelledby={`${sectionId}-title`}>
            <h2 id={`${sectionId}-title`} className="help-section__title">
              {sections[sectionId].title}
            </h2>
            <HelpBlocks blocks={sections[sectionId].blocks} />
          </section>
        ))}
      </div>

      <ChapterNavigation handbook={handbook.data} index={index} />
    </article>
  )
}

function ChapterNavigation({ handbook, index }: { handbook: Handbook; index: number }) {
  const { t } = useTranslation()
  const previous = CHAPTER_IDS[index - 1]
  const next = CHAPTER_IDS[index + 1]
  return (
    <nav className="help-pager" aria-label={t('help.chapterNavigation')}>
      {previous && (
        <Link to={`/help/${previous}`} className="card help-pager__link" rel="prev">
          <span className="help-pager__label">
            <ChevronLeftIcon width={16} height={16} />
            {t('help.previous')}
          </span>
          <span className="help-pager__title">{handbook[previous].title}</span>
        </Link>
      )}
      {next && (
        <Link to={`/help/${next}`} className="card help-pager__link help-pager__link--next" rel="next">
          <span className="help-pager__label">
            {t('help.next')}
            <ChevronRightIcon width={16} height={16} />
          </span>
          <span className="help-pager__title">{handbook[next].title}</span>
        </Link>
      )}
    </nav>
  )
}
