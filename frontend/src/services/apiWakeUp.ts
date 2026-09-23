import { getApiUrl } from '../config/api'
import { isSharedData } from '../config/dataProvider'

/**
 * Starts waking the API when the data is kept there. The demo API sleeps
 * after a quiet period and can take up to a minute to answer; sending a
 * request right away, e.g. while the visitor is on the sign-in page, makes
 * it wake up before the first page needs data. Nothing waits for the answer,
 * and failures are ignored: pages show their own loading and error states.
 */
export function startWakingApi(send: typeof fetch = fetch): void {
  const apiUrl = getApiUrl()
  if (!isSharedData() || !apiUrl) return
  send(`${apiUrl}/api/health`).catch(() => {})
}
