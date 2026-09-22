import { useEffect, useState } from 'react'
import { getApiUrl } from '../../config/api'
import { fetchSuggestionsAvailable } from '../../services/maintenanceSuggestions'

// One check per API URL and page load; a failed check is retried the next time.
const checks = new Map<string, Promise<boolean>>()

function checkOnce(apiUrl: string): Promise<boolean> {
  let check = checks.get(apiUrl)
  if (!check) {
    check = fetchSuggestionsAvailable(apiUrl).catch(() => {
      checks.delete(apiUrl)
      return false
    })
    checks.set(apiUrl, check)
  }
  return check
}

/** Forgets earlier checks; for tests. */
export function resetSuggestionsAvailability() {
  checks.clear()
}

/**
 * Whether AI maintenance suggestions can be offered: the API URL is configured
 * and the API reports the feature. `null` while the API is being asked.
 */
export function useSuggestionsAvailable(): { apiUrl: string | null; available: boolean | null } {
  const apiUrl = getApiUrl()
  const [result, setResult] = useState<{ apiUrl: string; available: boolean } | null>(null)

  useEffect(() => {
    if (!apiUrl) return
    let cancelled = false
    // Asking early also wakes up a sleeping API while the user types.
    void checkOnce(apiUrl).then((available) => {
      if (!cancelled) setResult({ apiUrl, available })
    })
    return () => {
      cancelled = true
    }
  }, [apiUrl])

  if (!apiUrl) return { apiUrl, available: false }
  return { apiUrl, available: result?.apiUrl === apiUrl ? result.available : null }
}
