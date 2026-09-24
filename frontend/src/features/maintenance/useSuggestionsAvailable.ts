import { resetApiFeatures, useApiFeature } from '../../hooks/useApiFeature'

/** Forgets earlier checks; for tests. */
export const resetSuggestionsAvailability = resetApiFeatures

/**
 * Whether AI maintenance suggestions can be offered: the API URL is configured
 * and the API reports the feature. `null` while the API is being asked.
 */
export function useSuggestionsAvailable(): { apiUrl: string | null; available: boolean | null } {
  return useApiFeature('maintenanceSuggestions')
}
