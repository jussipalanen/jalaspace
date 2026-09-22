import type { RequestHandler } from 'express'

/**
 * Turns an allowed origin into a pattern. `*` matches letters, digits and
 * hyphens within one host label, e.g. `https://jalaspace-*-team.vercel.app`
 * matches Vercel preview URLs but never another domain.
 */
function originPattern(origin: string): RegExp {
  const escaped = origin.toLowerCase().replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replaceAll('*', '[a-z0-9-]+')}$`)
}

/**
 * Lets the listed origins call the API from a browser. Other origins get no
 * CORS headers, so browsers block them; this does not stop non-browser clients.
 */
export function cors(allowedOrigins: readonly string[]): RequestHandler {
  const patterns = allowedOrigins.map(originPattern)

  return (request, response, next) => {
    const origin = request.headers.origin
    response.vary('Origin')
    if (!origin || !patterns.some((pattern) => pattern.test(origin.toLowerCase()))) {
      next()
      return
    }

    response.set('Access-Control-Allow-Origin', origin)
    if (request.method === 'OPTIONS') {
      response.set({
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
      })
      response.status(204).end()
      return
    }
    next()
  }
}
