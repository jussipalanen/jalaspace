/** Optional features the API reports in `GET /api/features`. */
export type ApiFeature = 'maintenanceSuggestions' | 'ask'

export type ApiFeatures = Record<ApiFeature, boolean>

/** The Render free plan can take up to a minute to wake up, so wait that long. */
const TIMEOUT_MS = 60_000

/** Asks the API which optional features it offers; a feature it does not report is off. */
export async function fetchApiFeatures(apiUrl: string): Promise<ApiFeatures> {
  const response = await fetch(`${apiUrl}/api/features`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) return { maintenanceSuggestions: false, ask: false }
  const features: unknown = await response.json()
  const flag = (name: ApiFeature) =>
    typeof features === 'object' && features !== null && (features as Record<string, unknown>)[name] === true
  return { maintenanceSuggestions: flag('maintenanceSuggestions'), ask: flag('ask') }
}
