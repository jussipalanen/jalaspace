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
  normalizeFeatures,
  parseFeaturesFilter,
  parseRoomsFilter,
  SPACE_FEATURES,
  SPACE_ROOMS_FILTER_MAX,
  SPACE_STATUSES,
  type SpaceFilters,
} from '../services/spaces'
import type { SpaceFeature } from '../types/space'
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
    rooms: parseRoomsFilter(searchParams.get('rooms')),
    features: parseFeaturesFilter(searchParams.get('features')),
    query: searchParams.get('q') ?? '',
  }
  const hasFilters = Boolean(
    filters.propertyId ||
      filters.status ||
      filters.rooms !== null ||
      filters.features.length > 0 ||
      filters.query,
  )

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
  const setFilter = (key: 'property' | 'status' | 'rooms' | 'features' | 'q', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const toggleFeature = (feature: SpaceFeature, checked: boolean) =>
    setFilter(
      'features',
      (checked
        ? normalizeFeatures([...filters.features, feature])
        : filters.features.filter((item) => item !== feature)
      ).join(','),
    )

  const roomOptions = Array.from({ length: SPACE_ROOMS_FILTER_MAX }, (_, index) => index + 1)

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
            <div className="field space-filters__field">
              <label className="field__label" htmlFor="space-filter-rooms">
                {t('spaces.filters.rooms')}
              </label>
              <select
                id="space-filter-rooms"
                className="field__input"
                value={filters.rooms ?? ''}
                onChange={(event) => setFilter('rooms', event.target.value)}
              >
                <option value="">{t('spaces.filters.anyRooms')}</option>
                {roomOptions.map((count) => (
                  <option key={count} value={count}>
                    {count === SPACE_ROOMS_FILTER_MAX
                      ? t('space.roomsAtLeast', { count })
                      : t('space.rooms', { count })}
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
            <fieldset className="choice-group space-filters__features">
              <legend className="field__label">{t('spaces.filters.features')}</legend>
              <div className="choice-group__options">
                {SPACE_FEATURES.map((feature) => (
                  <label key={feature} className="choice-group__option">
                    <input
                      type="checkbox"
                      checked={filters.features.includes(feature)}
                      onChange={(event) => toggleFeature(feature, event.target.checked)}
                    />
                    {t(`space.feature.${feature}`)}
                  </label>
                ))}
              </div>
            </fieldset>
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
