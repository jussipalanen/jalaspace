import { useMatches } from 'react-router'
import type { RouteHandle } from '../types/navigation'

function isRouteHandle(handle: unknown): handle is RouteHandle {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    typeof (handle as { title?: unknown }).title === 'string'
  )
}

/** Returns the title of the deepest matched route that defines one. */
export function useRouteTitle(fallback = 'JalaSpace'): string {
  const matches = useMatches()
  const titled = matches.map((match) => match.handle).filter(isRouteHandle)
  return titled.at(-1)?.title ?? fallback
}
