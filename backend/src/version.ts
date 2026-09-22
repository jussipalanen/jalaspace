import packageJson from '../package.json' with { type: 'json' }

/** The app version; release-please keeps it in step with the frontend. */
export const VERSION: string = packageJson.version
