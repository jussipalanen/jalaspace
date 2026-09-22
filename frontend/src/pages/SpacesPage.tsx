import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { LayoutGridIcon, PlusIcon, SearchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { SearchField } from '../components/SearchField/SearchField'
import { SpaceTable } from '../features/spaces/SpaceTable'
import { useSpaceData } from '../features/spaces/useSpaceData'
import { useTranslation } from '../i18n/useTranslation'
import {
  buildSpaceRows,
  filterSpaceRows,
  isSpaceStatus,
  SPACE_STATUSES,
  type SpaceFilters,
} from '../services/spaces'
import { toIsoDate } from '../utils/date'
import './SpacesPage.css'

export function SpacesPage() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useSpaceData()
  const data = state.status === 'success' ? state.data : null

  const statusParam = searchParams.get('status') ?? ''
  const filters: SpaceFilters = {
    propertyId: searchParams.get('property') ?? '',
    status: isSpaceStatus(statusParam) ? statusParam : '',
    query: searchParams.get('q') ?? '',
  }
  const hasFilters = Boolean(filters.propertyId || filters.status || filters.query)

  const rows = useMemo(
    () =>
      data
        ? buildSpaceRows(
            data.spaces,
            data.properties,
            data.leases,
            data.tenants,
            toIsoDate(new Date()),
            locale,
          )
        : [],
    [data, locale],
  )
  const visible = filterSpaceRows(rows, filters, locale)
  const properties = useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true })
    return (data?.properties ?? []).toSorted((a, b) => collator.compare(a.name, b.name))
  }, [data, locale])

  // Filters live in the URL so they survive a reload and dashboard links can open them.
  const setFilter = (key: 'property' | 'status' | 'q', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const addLink = (
    <Link
      to={filters.propertyId ? `/units/new?property=${filters.propertyId}` : '/units/new'}
      className="button button--primary"
    >
      <PlusIcon width={16} height={16} />
      {t('spaces.add')}
    </Link>
  )

  return (
    <>
      <PageHeader
        title={t('pages.spaces.title')}
        description={t('pages.spaces.description')}
        actions={addLink}
      />

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && (
        <ErrorState message={t('spaces.loadError')} onRetry={state.reload} />
      )}

      {data && rows.length === 0 && (
        <EmptyState
          icon={LayoutGridIcon}
          title={t('spaces.empty.title')}
          description={t('spaces.empty.description')}
        >
          {addLink}
        </EmptyState>
      )}

      {data && rows.length > 0 && (
        <>
          <div className="space-filters" role="search" aria-label={t('spaces.filters.label')}>
            <div className="field space-filters__field">
              <label className="field__label" htmlFor="space-filter-property">
                {t('spaces.filters.property')}
              </label>
              <select
                id="space-filter-property"
                className="field__input"
                value={filters.propertyId}
                onChange={(event) => setFilter('property', event.target.value)}
              >
                <option value="">{t('spaces.filters.allProperties')}</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field space-filters__field">
              <label className="field__label" htmlFor="space-filter-status">
                {t('spaces.filters.status')}
              </label>
              <select
                id="space-filter-status"
                className="field__input"
                value={filters.status}
                onChange={(event) => setFilter('status', event.target.value)}
              >
                <option value="">{t('spaces.filters.allStatuses')}</option>
                {SPACE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`space.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field space-filters__search">
              <span className="field__label" aria-hidden="true">
                {t('spaces.filters.search')}
              </span>
              <SearchField
                label={t('spaces.filters.search')}
                placeholder={t('spaces.filters.searchPlaceholder')}
                value={filters.query}
                onChange={(value) => setFilter('q', value)}
              />
            </div>
          </div>

          <div className="list-toolbar">
            <p className="list-toolbar__count" aria-live="polite">
              {t('spaces.resultCount', { count: visible.length })}
            </p>
            {hasFilters && (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setSearchParams({}, { replace: true })}
              >
                {t('spaces.filters.clear')}
              </button>
            )}
          </div>

          {visible.length > 0 ? (
            <SpaceTable rows={visible} />
          ) : (
            <EmptyState
              icon={SearchIcon}
              title={t('spaces.noResults.title')}
              description={t('spaces.noResults.description')}
            >
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setSearchParams({}, { replace: true })}
              >
                {t('spaces.filters.clear')}
              </button>
            </EmptyState>
          )}
        </>
      )}
    </>
  )
}
