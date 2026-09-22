import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { BuildingIcon, PlusIcon, SearchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { SearchField } from '../components/SearchField/SearchField'
import { PropertyTable } from '../features/properties/PropertyTable'
import { usePropertySummaries } from '../features/properties/usePropertyData'
import { useTranslation } from '../i18n/useTranslation'
import { matchesPropertySearch } from '../services/properties'

export function PropertiesPage() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const { status, summaries, reload } = usePropertySummaries()

  const visible = useMemo(
    () => summaries?.filter((item) => matchesPropertySearch(item.property, query, locale)) ?? [],
    [summaries, query, locale],
  )

  // The search term lives in the URL so results survive a reload and can be shared.
  const setQuery = (value: string) =>
    setSearchParams(value ? { q: value } : {}, { replace: true })

  const addLink = (
    <Link to="/properties/new" className="button button--primary">
      <PlusIcon width={16} height={16} />
      {t('properties.add')}
    </Link>
  )

  return (
    <>
      <PageHeader
        title={t('pages.properties.title')}
        description={t('pages.properties.description')}
        actions={addLink}
      />

      {status === 'loading' && <LoadingState />}
      {status === 'error' && <ErrorState message={t('properties.loadError')} onRetry={reload} />}

      {summaries && summaries.length === 0 && (
        <EmptyState
          icon={BuildingIcon}
          title={t('properties.empty.title')}
          description={t('properties.empty.description')}
        >
          {addLink}
        </EmptyState>
      )}

      {summaries && summaries.length > 0 && (
        <>
          <div className="list-toolbar">
            <SearchField
              label={t('properties.search.label')}
              placeholder={t('properties.search.placeholder')}
              value={query}
              onChange={setQuery}
            />
            <p className="list-toolbar__count" aria-live="polite">
              {t('properties.resultCount', { count: visible.length })}
            </p>
          </div>

          {visible.length > 0 ? (
            <PropertyTable items={visible} />
          ) : (
            <EmptyState
              icon={SearchIcon}
              title={t('properties.noResults.title', { query: query.trim() })}
              description={t('properties.noResults.description')}
            >
              <button type="button" className="button button--secondary" onClick={() => setQuery('')}>
                {t('properties.search.clear')}
              </button>
            </EmptyState>
          )}
        </>
      )}
    </>
  )
}
