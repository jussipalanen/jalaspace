/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Persistence implementation: `localStorage` (default) or `api` (planned). */
  readonly VITE_DATA_PROVIDER?: string
  /** Base URL of the JalaSpace API, e.g. `http://localhost:3000`. Unset: no API features. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
