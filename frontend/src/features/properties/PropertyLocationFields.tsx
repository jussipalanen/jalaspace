import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { FormField } from '../../components/FormField/FormField'
import { LocationMap } from '../../components/LocationMap/LazyLocationMap'
import { useTranslation } from '../../i18n/useTranslation'
import {
  ADDRESS_SEARCH_MAX_LENGTH,
  AddressSearchError,
  searchAddress,
  type AddressMatch,
  type AddressSearchErrorCode,
} from '../../services/addressSearch'
import { DEFAULT_MAP_ZOOM, formatCoordinate } from '../../services/location'
import {
  addressSearchText,
  toLocation,
  type PropertyFormErrors,
  type PropertyFormValues,
} from '../../services/properties'
import type { GeoLocation } from '../../types/property'
import './PropertyLocationFields.css'

type SearchState =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'results'; matches: AddressMatch[] }
  | { status: 'chosen'; label: string }
  | { status: 'invalid'; reason: 'required' | 'tooLong' }
  | { status: 'error'; code: AddressSearchErrorCode }

interface PropertyLocationFieldsProps {
  values: PropertyFormValues
  errors: Pick<PropertyFormErrors, 'latitude' | 'longitude'>
  latitudeId: string
  longitudeId: string
  /** Sets the latitude and longitude text; both empty clears the location. */
  onChange: (latitude: string, longitude: string) => void
  /** Sets the zoom level saved with the location. */
  onZoomChange: (zoom: number) => void
}

/**
 * The optional location of a property: an address search, a map with a
 * draggable pin, and latitude and longitude inputs for keyboard users.
 */
export function PropertyLocationFields({
  values,
  errors,
  latitudeId,
  longitudeId,
  onChange,
  onZoomChange,
}: PropertyLocationFieldsProps) {
  const { t, language } = useTranslation()
  const idPrefix = useId()
  const searchId = `${idPrefix}-search`
  const resultsId = `${idPrefix}-results`
  const addressText = addressSearchText(values)
  // `null` until the user edits the search, so it follows the address fields.
  const [editedQuery, setEditedQuery] = useState<string | null>(null)
  const [search, setSearch] = useState<SearchState>({ status: 'idle' })
  const query = editedQuery ?? addressText
  const { latitude, longitude } = values
  // A stable object, so the map only moves when the coordinates change; it gets the zoom level separately.
  const location = useMemo(
    () => toLocation({ latitude, longitude, zoom: DEFAULT_MAP_ZOOM }),
    [latitude, longitude],
  )

  const setLocation = (next: GeoLocation) => {
    onChange(formatCoordinate(next.latitude), formatCoordinate(next.longitude))
  }

  const runSearch = async () => {
    const text = query.trim()
    if (!text) return setSearch({ status: 'invalid', reason: 'required' })
    if (text.length > ADDRESS_SEARCH_MAX_LENGTH) return setSearch({ status: 'invalid', reason: 'tooLong' })

    setSearch({ status: 'searching' })
    try {
      const matches = await searchAddress(text, language)
      setSearch({ status: 'results', matches })
    } catch (error) {
      setSearch({ status: 'error', code: error instanceof AddressSearchError ? error.code : 'failed' })
    }
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Enter searches instead of submitting the property form.
    if (event.key === 'Enter') {
      event.preventDefault()
      void runSearch()
    }
  }

  const choose = (match: AddressMatch) => {
    setLocation(match.location)
    setSearch({ status: 'chosen', label: match.label })
  }

  const searchMessage =
    search.status === 'invalid'
      ? search.reason === 'required'
        ? t('properties.location.search.required')
        : t('properties.location.search.tooLong', { max: ADDRESS_SEARCH_MAX_LENGTH })
      : undefined

  return (
    <fieldset className="location-fields">
      <legend className="location-fields__legend">{t('properties.location.legend')}</legend>
      <p className="field__hint">{t('properties.location.hint')}</p>

      <div className="location-fields__search">
        <FormField
          id={searchId}
          label={t('properties.location.search.label')}
          hint={`${t('properties.location.search.hint')} ${t('properties.location.search.privacy')}`}
          error={searchMessage}
        >
          {(control) => (
            <input
              {...control}
              type="search"
              className="field__input"
              value={query}
              onChange={(event) => {
                setEditedQuery(event.target.value)
                if (search.status === 'invalid') setSearch({ status: 'idle' })
              }}
              onKeyDown={handleSearchKeyDown}
            />
          )}
        </FormField>
        <button
          type="button"
          className="button button--secondary location-fields__search-button"
          onClick={() => void runSearch()}
          disabled={search.status === 'searching'}
        >
          {search.status === 'searching'
            ? t('properties.location.search.searching')
            : t('properties.location.search.submit')}
        </button>
      </div>

      <div aria-live="polite" className="location-fields__status">
        {search.status === 'results' && search.matches.length === 0 && (
          <p className="field__hint">{t('properties.location.search.noResults')}</p>
        )}
        {search.status === 'chosen' && (
          <p className="field__hint">{t('properties.location.search.chosen', { label: search.label })}</p>
        )}
      </div>
      {search.status === 'error' && (
        <div className="alert alert--error" role="alert">
          {t(`properties.location.search.errors.${search.code}`)}
        </div>
      )}

      {search.status === 'results' && search.matches.length > 0 && (
        <div className="location-fields__results">
          <p id={resultsId} className="location-fields__results-title">
            {t('properties.location.search.results')}
          </p>
          <p className="field__hint">{t('properties.location.search.choose')}</p>
          <ul aria-labelledby={resultsId} className="location-fields__matches">
            {search.matches.map((match) => (
              <li key={match.label}>
                <button type="button" className="location-fields__match" onClick={() => choose(match)}>
                  {match.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <LocationMap
        location={location}
        zoom={values.zoom}
        label={t('properties.location.formMapLabel')}
        onChange={setLocation}
        onZoomChange={onZoomChange}
      />

      <div className="entity-form__row">
        <FormField
          id={latitudeId}
          label={t('properties.form.fields.latitude')}
          hint={t('properties.form.hints.latitude')}
          error={errors.latitude ? t(`properties.form.validation.latitude.${errors.latitude}`) : undefined}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              inputMode="decimal"
              value={values.latitude}
              onChange={(event) => onChange(event.target.value, values.longitude)}
            />
          )}
        </FormField>
        <FormField
          id={longitudeId}
          label={t('properties.form.fields.longitude')}
          hint={t('properties.form.hints.longitude')}
          error={errors.longitude ? t(`properties.form.validation.longitude.${errors.longitude}`) : undefined}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              inputMode="decimal"
              value={values.longitude}
              onChange={(event) => onChange(values.latitude, event.target.value)}
            />
          )}
        </FormField>
      </div>

      <div>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            onChange('', '')
            onZoomChange(DEFAULT_MAP_ZOOM)
            setSearch({ status: 'idle' })
          }}
          disabled={!values.latitude && !values.longitude}
        >
          {t('properties.location.clear')}
        </button>
      </div>
    </fieldset>
  )
}
