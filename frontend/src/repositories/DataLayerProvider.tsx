import type { ReactNode } from 'react'
import type { DataLayer } from '.'
import { DataLayerContext } from './DataLayerContext'

/** Overrides the data layer, e.g. with fakes in tests. */
export function DataLayerProvider({
  dataLayer,
  children,
}: {
  dataLayer: DataLayer
  children: ReactNode
}) {
  return <DataLayerContext.Provider value={() => dataLayer}>{children}</DataLayerContext.Provider>
}
