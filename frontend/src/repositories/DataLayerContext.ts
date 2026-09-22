import { createContext } from 'react'
import { getDataLayer, type DataLayer } from '.'

/**
 * Provides a getter rather than the data layer itself, so a configuration
 * error is raised inside data loading (and shown as an error state) instead
 * of crashing the whole app during render.
 */
export const DataLayerContext = createContext<() => DataLayer>(getDataLayer)
