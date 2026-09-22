import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { PlusIcon, SearchIcon, UsersIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { SearchField } from '../components/SearchField/SearchField'
import { TenantTable } from '../features/tenants/TenantTable'
import { useTenantData } from '../features/tenants/useTenantData'
import { useTranslation } from '../i18n/useTranslation'
import {
  buildTenantRows,
  filterTenantRows,
  isTenantType,
  TENANT_TYPES,
  type TenantFilters,
} from '../services/tenants'
import { toIsoDate } from '../utils/date'
import './TenantsPage.css'

export function TenantsPage() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useTenantData()
  const data = state.status === 'success' ? state.data : null

  const typeParam = searchParams.get('type') ?? ''
  const filters: TenantFilters = {
    type: isTenantType(typeParam) ? typeParam : '',
    query: searchParams.get('q') ?? '',
  }
  const hasFilters = Boolean(filters.type || filters.query)

  const rows = useMemo(
    () =>
      data
        ? buildTenantRows(
            data.tenants,
            data.leases,
            data.spaces,
            data.properties,
            toIsoDate(new Date()),
            locale,
          )
        : [],
    [data, locale],
  )
  const visible = filterTenantRows(rows, filters, locale)

  // Filters live in the URL so they survive a reload and can be shared.
  const setFilter = (key: 'type' | 'q', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }
  const clearFilters = () => setSearchParams({}, { replace: true })

  const addLink = (
    <Link to="/tenants/new" className="button button--primary">
      <PlusIcon width={16} height={16} />
      {t('tenants.add')}
    </Link>
  )

  return (
    <>
      <PageHeader
        title={t('pages.tenants.title')}
        description={t('pages.tenants.description')}
        actions={addLink}
      />

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && (
        <ErrorState message={t('tenants.loadError')} onRetry={state.reload} />
      )}

      {data && rows.length === 0 && (
        <EmptyState
          icon={UsersIcon}
          title={t('tenants.empty.title')}
          description={t('tenants.empty.description')}
        >
          {addLink}
        </EmptyState>
      )}

      {data && rows.length > 0 && (
        <>
          <div className="tenant-filters" role="search" aria-label={t('tenants.filters.label')}>
            <div className="field">
              <label className="field__label" htmlFor="tenant-filter-type">
                {t('tenants.filters.type')}
              </label>
              <select
                id="tenant-filter-type"
                className="field__input"
                value={filters.type}
                onChange={(event) => setFilter('type', event.target.value)}
              >
                <option value="">{t('tenants.filters.allTypes')}</option>
                {TENANT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`tenant.type.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field tenant-filters__search">
              <span className="field__label" aria-hidden="true">
                {t('tenants.filters.search')}
              </span>
              <SearchField
                label={t('tenants.filters.search')}
                placeholder={t('tenants.filters.searchPlaceholder')}
                value={filters.query}
                onChange={(value) => setFilter('q', value)}
              />
            </div>
          </div>

          <div className="list-toolbar">
            <p className="list-toolbar__count" aria-live="polite">
              {t('tenants.resultCount', { count: visible.length })}
            </p>
            {hasFilters && (
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                {t('tenants.filters.clear')}
              </button>
            )}
          </div>

          {visible.length > 0 ? (
            <TenantTable rows={visible} />
          ) : (
            <EmptyState
              icon={SearchIcon}
              title={t('tenants.noResults.title')}
              description={t('tenants.noResults.description')}
            >
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                {t('tenants.filters.clear')}
              </button>
            </EmptyState>
          )}
        </>
      )}
    </>
  )
}
