import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { BuildingIcon, MapPinIcon, SearchIcon } from '../components/icons'
import { SpaceFacts, SpaceFeatureChips } from '../features/apply/SpaceFacts'
import { useOpenSpaces } from '../features/apply/useOpenSpaces'
import { useTranslation } from '../i18n/useTranslation'
import { filterOpenSpaces, type OpenSpace, type OpenSpaceFilters } from '../services/applications'
import { isSpaceType, SPACE_TYPES } from '../services/spaces'
import './ApplyPage.css'

/** Public page: the spaces anyone can apply for, as cards. */
export function ApplyPage() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useOpenSpaces()
  const spaces = state.status === 'success' ? state.data : null

  const typeParam = searchParams.get('type') ?? ''
  const filters: OpenSpaceFilters = {
    city: searchParams.get('city') ?? '',
    type: isSpaceType(typeParam) ? typeParam : '',
  }
  const hasFilters = Boolean(filters.city || filters.type)

  const cities = useMemo(() => {
    const collator = new Intl.Collator(locale)
    return [...new Set((spaces ?? []).map(({ property }) => property.city))].toSorted(collator.compare)
  }, [spaces, locale])
  const types = SPACE_TYPES.filter((type) => (spaces ?? []).some(({ space }) => space.type === type))
  const visible = spaces ? filterOpenSpaces(spaces, filters) : []

  // Filters live in the URL so they survive a reload and can be shared.
  const setFilter = (key: 'city' | 'type', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }
  const clearFilters = () => setSearchParams({}, { replace: true })

  return (
    <>
      <div className="apply-hero">
        <h1 className="apply-hero__title">{t('apply.list.title')}</h1>
        <p className="apply-hero__intro">{t('apply.list.intro')}</p>
      </div>

      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && <ErrorState message={t('apply.list.loadError')} onRetry={state.reload} />}

      {spaces && spaces.length === 0 && (
        <EmptyState
          icon={BuildingIcon}
          title={t('apply.list.empty.title')}
          description={t('apply.list.empty.description')}
        />
      )}

      {spaces && spaces.length > 0 && (
        <>
          <div className="apply-filters" role="search" aria-label={t('apply.list.filters.label')}>
            <div className="field">
              <label className="field__label" htmlFor="apply-filter-city">
                {t('apply.list.filters.city')}
              </label>
              <select
                id="apply-filter-city"
                className="field__input"
                value={filters.city}
                onChange={(event) => setFilter('city', event.target.value)}
              >
                <option value="">{t('apply.list.filters.allCities')}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="apply-filter-type">
                {t('apply.list.filters.type')}
              </label>
              <select
                id="apply-filter-type"
                className="field__input"
                value={filters.type}
                onChange={(event) => setFilter('type', event.target.value)}
              >
                <option value="">{t('apply.list.filters.allTypes')}</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {t(`space.type.${type}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="list-toolbar">
            <p className="list-toolbar__count" aria-live="polite">
              {t('apply.list.resultCount', { count: visible.length })}
            </p>
            {hasFilters && (
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                {t('apply.list.filters.clear')}
              </button>
            )}
          </div>

          {visible.length > 0 ? (
            <ul className="apply-cards">
              {visible.map((item) => (
                <li key={item.space.id}>
                  <SpaceCard item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={SearchIcon}
              title={t('apply.list.noResults.title')}
              description={t('apply.list.noResults.description')}
            >
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                {t('apply.list.filters.clear')}
              </button>
            </EmptyState>
          )}
        </>
      )}
    </>
  )
}

function SpaceCard({ item: { space, property } }: { item: OpenSpace }) {
  const { t } = useTranslation()
  return (
    <article className="card space-card" aria-labelledby={`space-card-${space.id}`}>
      <p className="space-card__place">
        <MapPinIcon width={16} height={16} />
        {property.city} · {property.name}
      </p>
      <h2 id={`space-card-${space.id}`} className="space-card__title">
        {space.name}
      </h2>
      <p className="space-card__type">{t(`space.type.${space.type}`)}</p>
      <SpaceFacts space={space} />
      <SpaceFeatureChips space={space} />
      <Link
        to={`/apply/${space.id}`}
        className="button button--primary space-card__apply"
        aria-label={t('apply.list.applyFor', { space: space.name, property: property.name })}
      >
        {t('apply.list.apply')}
      </Link>
    </article>
  )
}
