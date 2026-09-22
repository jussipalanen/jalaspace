import { useCallback } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDataLayer } from '../../hooks/useDataLayer'
import { loadSpaceData } from '../../services/spaceService'

/** Loads everything the space pages need in one go. */
export function useSpaceData() {
  const getDataLayer = useDataLayer()
  const load = useCallback(() => loadSpaceData(getDataLayer()), [getDataLayer])
  return useAsyncData(load)
}
