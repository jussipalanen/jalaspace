import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import {
  DEFAULT_MAP_ZOOM,
  isSameLocation,
  MAP_ZOOM_MAX,
  MAP_ZOOM_MIN,
  roundLocation,
} from '../../services/location'
import type { GeoLocation } from '../../types/property'
import './LocationMap.css'

// Leaflet with OpenStreetMap tiles. The tile usage policy
// (https://operations.osmfoundation.org/policies/tiles/) requires the
// attribution, which the map always shows.

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
/** Finland, shown before a location is set. */
const DEFAULT_VIEW = { center: [64.5, 26] as L.LatLngTuple, zoom: 5 }

const PIN_ICON = L.divIcon({
  className: 'location-map__pin',
  html: '<svg viewBox="0 0 28 40" width="28" height="40" aria-hidden="true"><path d="M14 0C6.3 0 0 6.2 0 13.9 0 24.3 14 40 14 40s14-15.7 14-26.1C28 6.2 21.7 0 14 0Z" fill="currentColor"/><circle cx="14" cy="14" r="5.5" fill="#fff"/></svg>',
  iconSize: [28, 40],
  iconAnchor: [14, 40],
})

const toLatLng = (location: GeoLocation): L.LatLngTuple => [location.latitude, location.longitude]
const toLocation = (latLng: L.LatLng): GeoLocation => roundLocation({ latitude: latLng.lat, longitude: latLng.lng })

export interface LocationMapProps {
  location: GeoLocation | null
  /** Zoom level to show `location` at; 16 when not given. */
  zoom?: number
  /** Accessible name of the map, e.g. "Map of Joensuu Center". */
  label: string
  /** Makes the pin draggable and lets a click on the map place it. */
  onChange?: (location: GeoLocation) => void
  /** Called when the user zooms the map while a pin is set. */
  onZoomChange?: (zoom: number) => void
}

/** A map with a pin at `location`; loaded lazily through `LazyLocationMap`. */
export default function LocationMap({
  location,
  zoom = DEFAULT_MAP_ZOOM,
  label,
  onChange,
  onZoomChange,
}: LocationMapProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const onZoomChangeRef = useRef(onZoomChange)
  // Read when the pin moves elsewhere; a change of zoom alone does not move the map.
  const zoomRef = useRef(zoom)
  const [map, setMap] = useState<L.Map | null>(null)
  const editable = onChange !== undefined

  const attribution = `&copy; <a href="https://www.openstreetmap.org/copyright">${t('properties.location.attribution')}</a>`
  const zoomInTitle = t('properties.location.zoomIn')
  const zoomOutTitle = t('properties.location.zoomOut')
  const pinTitle = t(editable ? 'properties.location.pinEditable' : 'properties.location.pin')

  useEffect(() => {
    onChangeRef.current = onChange
    onZoomChangeRef.current = onZoomChange
    zoomRef.current = zoom
  })

  // Created again when the language changes, so the controls use the new texts.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const created = L.map(container, {
      ...DEFAULT_VIEW,
      minZoom: MAP_ZOOM_MIN,
      maxZoom: MAP_ZOOM_MAX,
      zoomControl: false,
      // The page scrolls over the map; zoom with the buttons or pinch.
      scrollWheelZoom: false,
    })
    created.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>')
    L.control.zoom({ zoomInTitle, zoomOutTitle }).addTo(created)
    L.tileLayer(TILE_URL, { maxZoom: MAP_ZOOM_MAX, attribution }).addTo(created)
    if (editable) created.on('click', (event) => onChangeRef.current?.(toLocation(event.latlng)))
    // Only the zoom level of a set location is kept. An animated zoom reports its
    // target when it starts, so a save right after zooming keeps the new level.
    const reportZoom = (zoom: number) => {
      if (markerRef.current) onZoomChangeRef.current?.(zoom)
    }
    created.on('zoomanim', (event) => reportZoom(event.zoom))
    created.on('zoomend', () => reportZoom(created.getZoom()))

    // Leaflet measures its container; measure again when the layout changes.
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => created.invalidateSize())
    resizeObserver?.observe(container)

    setMap(created)
    return () => {
      resizeObserver?.disconnect()
      markerRef.current = null
      created.remove()
      setMap(null)
    }
  }, [attribution, editable, zoomInTitle, zoomOutTitle])

  // Keeps the pin at `location`, and brings it into view at `zoom` when it moves
  // elsewhere. Zooming alone never moves the map, even with the pin out of view.
  useEffect(() => {
    if (!map) return
    if (!location) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    const latLng = toLatLng(location)
    const marker = markerRef.current
    if (!marker) {
      const created = L.marker(latLng, { icon: PIN_ICON, draggable: editable, keyboard: false, title: pinTitle })
      if (editable) created.on('dragend', (event) => onChangeRef.current?.(toLocation(event.target.getLatLng())))
      // Set the view before adding the pin, so the view change is not reported as the user's zoom.
      map.setView(latLng, zoomRef.current, { animate: false })
      created.addTo(map)
      markerRef.current = created
      return
    }
    if (isSameLocation(toLocation(marker.getLatLng()), location)) return
    marker.setLatLng(latLng)
    if (!map.getBounds().contains(latLng)) map.setView(latLng, zoomRef.current)
  }, [map, location, editable, pinTitle])

  return (
    <div className="location-map" role="region" aria-label={label}>
      <div ref={containerRef} className="location-map__canvas" />
    </div>
  )
}
