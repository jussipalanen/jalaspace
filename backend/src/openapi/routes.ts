import type { Router } from 'express'

export interface RouteInfo {
  /** Lower-case HTTP method, e.g. `get`. */
  method: string
  /** OpenAPI path with `{param}` placeholders, e.g. `/api/properties/{id}`. */
  path: string
}

interface Layer {
  route?: { path: string; methods: Record<string, boolean> }
  handle?: { stack?: Layer[] }
}

/**
 * Lists the routes of an Express router and the routers mounted in it with
 * `router.use(subRouter)`, in order and without duplicates. Mounted routers
 * must not have their own path prefix: every JalaSpace router is mounted at
 * the API root, so `prefix` is the only one.
 */
export function listRoutes(router: Router, prefix = ''): RouteInfo[] {
  const routes = new Map<string, RouteInfo>()
  const visit = (stack: readonly Layer[]) => {
    for (const layer of stack) {
      if (layer.route) {
        const path = prefix + layer.route.path.replace(/:(\w+)/g, '{$1}')
        for (const [method, enabled] of Object.entries(layer.route.methods)) {
          if (enabled && method !== '_all') routes.set(`${method} ${path}`, { method, path })
        }
      } else if (layer.handle?.stack) {
        visit(layer.handle.stack)
      }
    }
  }
  // Express keeps the layers in `stack`; its shape is stable in Express 5.
  visit((router as unknown as { stack: Layer[] }).stack)
  return [...routes.values()]
}
