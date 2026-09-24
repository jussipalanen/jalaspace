import { useEffect, useState } from 'react'
import { getApiUrl } from '../config/api'
import { fetchApiFeatures, type ApiFeature, type ApiFeatures } from '../services/apiFeatures'

// One check per API URL and page load; a failed check is retried the next time.
const checks = new Map<string, Promise<ApiFeatures | null>>()

function checkOnce(apiUrl: string): Promise<ApiFeatures | null> {
  let check = checks.get(apiUrl)
  if (!check) {
    check = fetchApiFeatures(apiUrl).catch(() => {
      checks.delete(apiUrl)
      return null
    })
    checks.set(apiUrl, check)
  }
  return check
}

/** Forgets earlier checks; for tests. */
export function resetApiFeatures() {
  checks.clear()
}

/**
 * Whether an optional API feature can be offered: the API URL is configured
 * and the API reports the feature. `null` while the API is being asked.
 */
export function useApiFeature(feature: ApiFeature): { apiUrl: string | null; available: boolean | null } {
  const apiUrl = getApiUrl()
  const [result, setResult] = useState<{ apiUrl: string; features: ApiFeatures | null } | null>(null)

  useEffect(() => {
    if (!apiUrl) return
    let cancelled = false
    // Asking early also wakes up a sleeping API.
    void checkOnce(apiUrl).then((features) => {
      if (!cancelled) setResult({ apiUrl, features })
    })
    return () => {
      cancelled = true
    }
  }, [apiUrl])

  if (!apiUrl) return { apiUrl, available: false }
  if (result?.apiUrl !== apiUrl) return { apiUrl, available: null }
  return { apiUrl, available: result.features?.[feature] ?? false }
}
