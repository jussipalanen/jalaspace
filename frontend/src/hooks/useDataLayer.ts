import { useContext } from 'react'
import type { DataLayer } from '../repositories'
import { DataLayerContext } from '../repositories/DataLayerContext'

/** Returns a getter for the configured repositories. Call it inside async loaders. */
export function useDataLayer(): () => DataLayer {
  return useContext(DataLayerContext)
}
