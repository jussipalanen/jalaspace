import { Link } from 'react-router'
import { LocationMap } from '../../components/LocationMap/LazyLocationMap'
import { useTranslation } from '../../i18n/useTranslation'
import { formatCoordinate } from '../../services/location'
import type { Property } from '../../types/property'

/** The property's location on a map, or a way to set it. */
export function PropertyLocationCard({ property }: { property: Property }) {
  const { t } = useTranslation()
  // Data saved before locations existed has no `location` field.
  const location = property.location ?? null

  return (
    <section className="card property-location" aria-labelledby="property-location-title">
      <h2 id="property-location-title" className="section__title">
        {t('properties.location.title')}
      </h2>
      {location ? (
        <>
          <LocationMap location={location} label={t('properties.location.mapLabel', { name: property.name })} />
          <p className="property-location__coordinates">
            <span>
              {t('properties.location.coordinates', {
                latitude: formatCoordinate(location.latitude),
                longitude: formatCoordinate(location.longitude),
              })}
            </span>
            <a
              href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`}
            >
              {t('properties.location.openInOsm')}
            </a>
          </p>
        </>
      ) : (
        <div className="property-location__empty">
          <p>{t('properties.location.empty')}</p>
          <Link to={`/properties/${property.id}/edit`} className="button button--secondary">
            {t('properties.location.setLocation')}
          </Link>
        </div>
      )}
    </section>
  )
}
