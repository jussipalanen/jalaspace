import { Component, lazy, Suspense, type ReactNode } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import type { LocationMapProps } from './LocationMap'
import './LocationMap.css'

// Leaflet is only needed on pages that show a map, so it is loaded on demand.
const LocationMapImpl = lazy(() => import('./LocationMap'))

interface LoadBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

/** Shows `fallback` instead of breaking the page when the map code cannot be loaded. */
class LoadBoundary extends Component<LoadBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function MapLoadError() {
  const { t } = useTranslation()
  return (
    <div className="location-map location-map--message" role="alert">
      {t('properties.location.loadError')}
    </div>
  )
}

export function LocationMap(props: LocationMapProps) {
  return (
    <LoadBoundary fallback={<MapLoadError />}>
      <Suspense fallback={<div className="location-map location-map--loading" aria-hidden="true" />}>
        <LocationMapImpl {...props} />
      </Suspense>
    </LoadBoundary>
  )
}
