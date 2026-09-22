import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { useTranslation } from '../i18n/useTranslation'

/** Shown when rendering a route throws, so a single page error does not blank the app. */
export function RouteErrorPage() {
  const error = useRouteError()
  const { t } = useTranslation()

  useEffect(() => {
    if (import.meta.env.DEV) console.error(error)
  }, [error])

  return (
    <div className="route-error">
      <EmptyState
        headingLevel="h1"
        title={t('pages.error.title')}
        description={t('pages.error.description')}
      >
        <button
          type="button"
          className="button button--primary"
          onClick={() => window.location.reload()}
        >
          {t('pages.error.action')}
        </button>
      </EmptyState>
    </div>
  )
}
