import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { InboxIcon, SearchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { SearchField } from '../components/SearchField/SearchField'
import { ApplicationTable } from '../features/applications/ApplicationTable'
import { useApplicationData } from '../features/applications/useApplicationData'
import { useTranslation } from '../i18n/useTranslation'
import {
  APPLICATION_STATUSES,
  buildApplicationRows,
  filterApplicationRows,
  isApplicationStatusFilter,
  type ApplicationFilters,
} from '../services/applications'
import './ApplicationsPage.css'

export function ApplicationsPage() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useApplicationData()
  const data = state.status === 'success' ? state.data : null

  const statusParam = searchParams.get('status') ?? ''
  const filters: ApplicationFilters = {
    status: isApplicationStatusFilter(statusParam) ? statusParam : '',
    propertyId: searchParams.get('property') ?? '',
    query: searchParams.get('q') ?? '',
  }
  const hasFilters = Boolean(filters.status || filters.propertyId || filters.query)

  const rows = useMemo(
    () => (data ? buildApplicationRows(data.applications, data.spaces, data.properties) : []),
    [data],
  )
  const properties = useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true })
    return (data?.properties ?? []).toSorted((a, b) => collator.compare(a.name, b.name))
  }, [data, locale])
  const visible = filterApplicationRows(rows, filters, locale)

  // Filters live in the URL so they survive a reload and can be shared.
  const setFilter = (key: 'status' | 'property' | 'q', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }
  const clearFilters = () => setSearchParams({}, { replace: true })

  return (
    <>
      <PageHeader title={t('pages.applications.title')} description={t('pages.applications.description')} />

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && (
        <ErrorState message={t('applications.loadError')} onRetry={state.reload} />
      )}

      {data && rows.length === 0 && (
        <EmptyState
          icon={InboxIcon}
          title={t('applications.empty.title')}
          description={t('applications.empty.description')}
        />
      )}

      {data && rows.length > 0 && (
        <>
          <div className="application-filters" role="search" aria-label={t('applications.filters.label')}>
            <div className="field">
              <label className="field__label" htmlFor="application-filter-status">
                {t('applications.filters.status')}
              </label>
              <select
                id="application-filter-status"
                className="field__input"
                value={filters.status}
                onChange={(event) => setFilter('status', event.target.value)}
              >
                <option value="">{t('applications.filters.allStatuses')}</option>
                <option value="open">{t('applications.filters.open')}</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`application.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="application-filter-property">
                {t('applications.filters.property')}
              </label>
              <select
                id="application-filter-property"
                className="field__input"
                value={filters.propertyId}
                onChange={(event) => setFilter('property', event.target.value)}
              >
                <option value="">{t('applications.filters.allProperties')}</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field application-filters__search">
              <span className="field__label" aria-hidden="true">
                {t('applications.filters.search')}
              </span>
              <SearchField
                label={t('applications.filters.search')}
                placeholder={t('applications.filters.searchPlaceholder')}
                value={filters.query}
                onChange={(value) => setFilter('q', value)}
              />
            </div>
          </div>

          <div className="list-toolbar">
            <p className="list-toolbar__count" aria-live="polite">
              {t('applications.resultCount', { count: visible.length })}
            </p>
            {hasFilters && (
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                {t('applications.filters.clear')}
              </button>
            )}
          </div>

          {visible.length > 0 ? (
            <ApplicationTable rows={visible} />
          ) : (
            <EmptyState
              icon={SearchIcon}
              title={t('applications.noResults.title')}
              description={t('applications.noResults.description')}
            >
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                {t('applications.filters.clear')}
              </button>
            </EmptyState>
          )}
        </>
      )}
    </>
  )
}
