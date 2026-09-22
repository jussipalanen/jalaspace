import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { BuildingIcon, PlusIcon, SearchIcon, WrenchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { SearchField } from '../components/SearchField/SearchField'
import { MaintenanceTable } from '../features/maintenance/MaintenanceTable'
import { useMaintenanceData } from '../features/maintenance/useMaintenanceData'
import { useTranslation } from '../i18n/useTranslation'
import {
  buildMaintenanceRows,
  filterMaintenanceRows,
  isMaintenancePriority,
  isMaintenanceStatus,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  type MaintenanceFilters,
} from '../services/maintenance'
import type { MaintenanceData } from '../services/maintenanceService'
import type { Property } from '../types/property'
import type { Space } from '../types/space'
import './MaintenancePage.css'

type FilterKey = 'property' | 'space' | 'priority' | 'status' | 'q'

export function MaintenancePage() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useMaintenanceData()
  const data = state.status === 'success' ? state.data : null

  const priorityParam = searchParams.get('priority') ?? ''
  const statusParam = searchParams.get('status') ?? ''
  const filters: MaintenanceFilters = {
    propertyId: searchParams.get('property') ?? '',
    spaceId: searchParams.get('space') ?? '',
    priority: isMaintenancePriority(priorityParam) ? priorityParam : '',
    status: isMaintenanceStatus(statusParam) ? statusParam : '',
    query: searchParams.get('q') ?? '',
  }
  const hasFilters = Boolean(
    filters.propertyId || filters.spaceId || filters.priority || filters.status || filters.query,
  )

  const rows = useMemo(
    () => (data ? buildMaintenanceRows(data.maintenance, data.properties, data.spaces, locale) : []),
    [data, locale],
  )
  const visible = filterMaintenanceRows(rows, filters, locale)

  const collator = useMemo(() => new Intl.Collator(locale, { numeric: true }), [locale])
  const properties = useMemo(
    () => (data?.properties ?? []).toSorted((a, b) => collator.compare(a.name, b.name)),
    [data, collator],
  )
  const spaceGroups = data
    ? groupSpaceOptions(properties, data, filters.propertyId, filters.spaceId, collator)
    : []

  // Filters live in the URL so they survive a reload and links can open them.
  const setFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    // A space belongs to one property, so a new property clears the space.
    if (key === 'property') next.delete('space')
    setSearchParams(next, { replace: true })
  }
  const clearFilters = () => setSearchParams({}, { replace: true })

  const addLink = (
    <Link
      to={filters.propertyId ? `/maintenance/new?property=${filters.propertyId}` : '/maintenance/new'}
      className="button button--primary"
    >
      <PlusIcon width={16} height={16} />
      {t('maintenance.add')}
    </Link>
  )
  const canAdd = !data || data.properties.length > 0

  return (
    <>
      <PageHeader
        title={t('pages.maintenance.title')}
        description={t('pages.maintenance.description')}
        actions={canAdd ? addLink : undefined}
      />

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && (
        <ErrorState message={t('maintenance.loadError')} onRetry={state.reload} />
      )}

      {data && rows.length === 0 && !canAdd && (
        <EmptyState
          icon={BuildingIcon}
          title={t('maintenance.noProperties.title')}
          description={t('maintenance.noProperties.description')}
        >
          <Link to="/properties/new" className="button button--primary">
            <PlusIcon width={16} height={16} />
            {t('maintenance.noProperties.action')}
          </Link>
        </EmptyState>
      )}

      {data && rows.length === 0 && canAdd && (
        <EmptyState
          icon={WrenchIcon}
          title={t('maintenance.empty.title')}
          description={t('maintenance.empty.description')}
        >
          {addLink}
        </EmptyState>
      )}

      {data && rows.length > 0 && (
        <>
          <div className="maintenance-filters" role="search" aria-label={t('maintenance.filters.label')}>
            <div className="field">
              <label className="field__label" htmlFor="maintenance-filter-property">
                {t('maintenance.filters.property')}
              </label>
              <select
                id="maintenance-filter-property"
                className="field__input"
                value={filters.propertyId}
                onChange={(event) => setFilter('property', event.target.value)}
              >
                <option value="">{t('maintenance.filters.allProperties')}</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="maintenance-filter-space">
                {t('maintenance.filters.space')}
              </label>
              <select
                id="maintenance-filter-space"
                className="field__input"
                value={filters.spaceId}
                onChange={(event) => setFilter('space', event.target.value)}
              >
                <option value="">{t('maintenance.filters.allSpaces')}</option>
                {filters.propertyId
                  ? spaceGroups[0]?.spaces.map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name}
                      </option>
                    ))
                  : spaceGroups.map((group) => (
                      <optgroup key={group.property.id} label={group.property.name}>
                        {group.spaces.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="maintenance-filter-priority">
                {t('maintenance.filters.priority')}
              </label>
              <select
                id="maintenance-filter-priority"
                className="field__input"
                value={filters.priority}
                onChange={(event) => setFilter('priority', event.target.value)}
              >
                <option value="">{t('maintenance.filters.allPriorities')}</option>
                {MAINTENANCE_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {t(`maintenance.priority.${priority}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="maintenance-filter-status">
                {t('maintenance.filters.status')}
              </label>
              <select
                id="maintenance-filter-status"
                className="field__input"
                value={filters.status}
                onChange={(event) => setFilter('status', event.target.value)}
              >
                <option value="">{t('maintenance.filters.allStatuses')}</option>
                {MAINTENANCE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`maintenance.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field maintenance-filters__search">
              <span className="field__label" aria-hidden="true">
                {t('maintenance.filters.search')}
              </span>
              <SearchField
                label={t('maintenance.filters.search')}
                placeholder={t('maintenance.filters.searchPlaceholder')}
                value={filters.query}
                onChange={(value) => setFilter('q', value)}
              />
            </div>
          </div>

          <div className="list-toolbar">
            <p className="list-toolbar__count" aria-live="polite">
              {t('maintenance.resultCount', { count: visible.length })}
            </p>
            {hasFilters && (
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                {t('maintenance.filters.clear')}
              </button>
            )}
          </div>

          {visible.length > 0 ? (
            <MaintenanceTable rows={visible} />
          ) : (
            <EmptyState
              icon={SearchIcon}
              title={t('maintenance.noResults.title')}
              description={t('maintenance.noResults.description')}
            >
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                {t('maintenance.filters.clear')}
              </button>
            </EmptyState>
          )}
        </>
      )}
    </>
  )
}

interface SpaceOptionGroup {
  property: Property
  spaces: Space[]
}

/**
 * Space filter options: the spaces that have tasks, plus the selected one,
 * grouped by property. With a property selected, only its group is returned.
 */
function groupSpaceOptions(
  properties: Property[],
  { spaces, maintenance }: MaintenanceData,
  propertyId: string,
  selectedSpaceId: string,
  collator: Intl.Collator,
): SpaceOptionGroup[] {
  const withTasks = new Set(maintenance.map((task) => task.spaceId))
  const options = spaces.filter((space) => withTasks.has(space.id) || space.id === selectedSpaceId)
  return properties
    .filter((property) => !propertyId || property.id === propertyId)
    .map((property) => ({
      property,
      spaces: options
        .filter((space) => space.propertyId === property.id)
        .toSorted((a, b) => collator.compare(a.name, b.name)),
    }))
    .filter((group) => group.spaces.length > 0 || group.property.id === propertyId)
}
