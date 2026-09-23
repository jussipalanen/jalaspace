import { Router } from 'express'
import type { OpenApiDocument } from '../openapi/document.ts'

// Swagger UI from jsDelivr, pinned to one version and checked with Subresource
// Integrity, so the page runs exactly these files or nothing. When updating
// the version, recompute both hashes:
//   curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
const SWAGGER_UI = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.0'
const SWAGGER_UI_JS_SRI = 'sha384-YDALVcy8kj8yltLBVi1vBiBAUqdxvus673gM8XKwiy6aDUJFXivF/KCufekjYbVf'
const SWAGGER_UI_CSS_SRI = 'sha384-Ov4/wv3j2bmct8cDc5X4ngJZohVPzEmc6uDPH8WeljUxO5vtoykvMEfbu9Vh6RaW'

/** Scripts only from this server and the pinned CDN files; requests only to this server. */
export const DOCS_CSP = [
  "default-src 'none'",
  "script-src 'self' https://cdn.jsdelivr.net",
  // Swagger UI sets style attributes.
  "style-src https://cdn.jsdelivr.net 'unsafe-inline'",
  "img-src 'self' data: https://cdn.jsdelivr.net",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ')

const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>JalaSpace API</title>
    <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" integrity="${SWAGGER_UI_CSS_SRI}" crossorigin="anonymous">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI}/swagger-ui-bundle.js" integrity="${SWAGGER_UI_JS_SRI}" crossorigin="anonymous"></script>
    <script src="/docs/swagger-init.js"></script>
  </body>
</html>
`

// A separate file rather than an inline script, so the CSP needs no 'unsafe-inline' for scripts.
const INIT_SCRIPT = `window.ui = SwaggerUIBundle({
  url: '/docs/openapi.json',
  dom_id: '#swagger-ui',
  deepLinking: true,
  displayRequestDuration: true,
})
`

/**
 * API documentation outside `/api`: `GET /docs` (Swagger UI), `GET /docs/openapi.json`
 * (the OpenAPI description) and `GET /` redirecting to the docs.
 */
export function docsRouter(document: OpenApiDocument): Router {
  const router = Router()

  router.get('/', (_request, response) => {
    response.redirect('/docs')
  })

  router.get('/docs', (_request, response) => {
    response
      .set({ 'Content-Security-Policy': DOCS_CSP, 'X-Robots-Tag': 'noindex, nofollow' })
      .type('html')
      .send(PAGE)
  })

  router.get('/docs/swagger-init.js', (_request, response) => {
    response.type('js').send(INIT_SCRIPT)
  })

  router.get('/docs/openapi.json', (_request, response) => {
    response.json(document)
  })

  return router
}
