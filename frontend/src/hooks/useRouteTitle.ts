import { useMatches } from 'react-router'
import type { MessageKey } from '../i18n/translate'
import type { RouteHandle } from '../types/navigation'

function isRouteHandle(handle: unknown): handle is RouteHandle {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    typeof (handle as { titleKey?: unknown }).titleKey === 'string'
  )
}

/** Returns the title key of the deepest matched route that defines one. */
export function useRouteTitleKey(): MessageKey | null {
  const matches = useMatches()
  const titled = matches.map((match) => match.handle).filter(isRouteHandle)
  return titled.at(-1)?.titleKey ?? null
}
