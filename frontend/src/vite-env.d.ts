/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Persistence implementation: `localStorage` (default) or `api` (planned). */
  readonly VITE_DATA_PROVIDER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
