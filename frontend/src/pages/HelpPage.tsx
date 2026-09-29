import { Link } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { useHandbook } from '../features/help/useHandbook'
import { CHAPTER_GROUPS, CHAPTER_IDS } from '../help/structure'
import { useTranslation } from '../i18n/useTranslation'
import './HelpPage.css'

/** The handbook's front page: every chapter, grouped like the sidebar. */
export function HelpPage() {
  const { t } = useTranslation()
  const handbook = useHandbook()

  return (
    <>
      <PageHeader title={t('pages.help.title')} description={t('pages.help.description')} />

      {handbook.status === 'loading' && <LoadingState label={t('help.loading')} />}
      {handbook.status === 'error' && <ErrorState message={t('help.loadError')} onRetry={handbook.reload} />}
      {handbook.status === 'success' && (
        <nav className="card help-contents" aria-labelledby="help-contents-title">
          <h2 id="help-contents-title" className="section__title">
            {t('help.contents')}
          </h2>
          {CHAPTER_GROUPS.map((group) => {
            const headingId = `help-group-${group.titleKey.replaceAll('.', '-')}`
            return (
              <section key={group.titleKey} className="help-contents__group" aria-labelledby={headingId}>
                <h3 id={headingId} className="help-contents__group-title">
                  {t(group.titleKey)}
                </h3>
                {/* Numbered across groups, so chapters keep the numbers shown on their pages. */}
                <ol className="help-contents__list" start={CHAPTER_IDS.indexOf(group.chapters[0]) + 1}>
                  {group.chapters.map((id) => (
                    <li key={id}>
                      <Link to={`/help/${id}`} className="help-contents__link">
                        {handbook.data[id].title}
                      </Link>
                      <p className="help-contents__summary">{handbook.data[id].summary}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )
          })}
        </nav>
      )}
    </>
  )
}
