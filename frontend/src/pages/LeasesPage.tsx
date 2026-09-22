import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { FileTextIcon, PlusIcon, SearchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { SearchField } from '../components/SearchField/SearchField'
import { LeaseTable } from '../features/leases/LeaseTable'
import { useLeaseData } from '../features/leases/useLeaseData'
import { useTranslation } from '../i18n/useTranslation'
import {
  buildLeaseRows,
  filterLeaseRows,
  isLeaseStatus,
  LEASE_STATUSES,
  type LeaseFilters,
} from '../services/leases'
import { toIsoDate } from '../utils/date'
import './LeasesPage.css'

export function LeasesPage() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useLeaseData()
  const data = state.status === 'success' ? state.data : null

  const statusParam = searchParams.get('status') ?? ''
  const filters: LeaseFilters = {
    status: isLeaseStatus(statusParam) ? statusParam : '',
    propertyId: searchParams.get('property') ?? '',
    query: searchParams.get('q') ?? '',
  }
  const hasFilters = Boolean(filters.status || filters.propertyId || filters.query)

  const rows = useMemo(
    () =>
      data
        ? buildLeaseRows(
            data.leases,
            data.tenants,
            data.spaces,
            data.properties,
            toIsoDate(new Date()),
            locale,
          )
        : [],
    [data, locale],
  )
  const visible = filterLeaseRows(rows, filters, locale)
  const properties = useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true })
    return (data?.properties ?? []).toSorted((a, b) => collator.compare(a.name, b.name))
  }, [data, locale])

  // Filters live in the URL so they survive a reload and can be shared.
  const setFilter = (key: 'status' | 'property' | 'q', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }
  const clearFilters = () => setSearchParams({}, { replace: true })

  const addLink = (
    <Link to="/leases/new" className="button button--primary">
      <PlusIcon width={16} height={16} />
      {t('leases.add')}
    </Link>
  )

  return (
    <>
      <PageHeader
        title={t('pages.leases.title')}
        description={t('pages.leases.description')}
        actions={addLink}
      />

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && <ErrorState message={t('leases.loadError')} onRetry={state.reload} />}

      {data && rows.length === 0 && (
        <EmptyState icon={FileTextIcon} title={t('leases.empty.title')} description={t('leases.empty.description')}>
          {addLink}
        </EmptyState>
      )}

      {data && rows.length > 0 && (
        <>
          <div className="lease-filters" role="search" aria-label={t('leases.filters.label')}>
            <div className="field">
              <label className="field__label" htmlFor="lease-filter-status">
                {t('leases.filters.status')}
              </label>
              <select
                id="lease-filter-status"
                className="field__input"
                value={filters.status}
                onChange={(event) => setFilter('status', event.target.value)}
              >
                <option value="">{t('leases.filters.allStatuses')}</option>
                {LEASE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`lease.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="lease-filter-property">
                {t('leases.filters.property')}
              </label>
              <select
                id="lease-filter-property"
                className="field__input"
                value={filters.propertyId}
                onChange={(event) => setFilter('property', event.target.value)}
              >
                <option value="">{t('leases.filters.allProperties')}</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field lease-filters__search">
              <span className="field__label" aria-hidden="true">
                {t('leases.filters.search')}
              </span>
              <SearchField
                label={t('leases.filters.search')}
                placeholder={t('leases.filters.searchPlaceholder')}
                value={filters.query}
                onChange={(value) => setFilter('q', value)}
              />
            </div>
          </div>

          <div className="list-toolbar">
            <p className="list-toolbar__count" aria-live="polite">
              {t('leases.resultCount', { count: visible.length })}
            </p>
            {hasFilters && (
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                {t('leases.filters.clear')}
              </button>
            )}
          </div>

          {visible.length > 0 ? (
            <LeaseTable rows={visible} />
          ) : (
            <EmptyState
              icon={SearchIcon}
              title={t('leases.noResults.title')}
              description={t('leases.noResults.description')}
            >
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                {t('leases.filters.clear')}
              </button>
            </EmptyState>
          )}
        </>
      )}
    </>
  )
}
