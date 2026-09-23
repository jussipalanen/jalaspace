import { useEffect, useState } from 'react'
import { isSharedData } from '../../config/dataProvider'
import { useTranslation } from '../../i18n/useTranslation'
import './DataState.css'

/** After this long, a load from the API is probably waiting for the server to wake up. */
export const SLOW_LOADING_MS = 4000

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation()
  const slow = useSlowLoading()
  return (
    <div className="data-state" role="status">
      <span className="data-state__spinner" aria-hidden="true" />
      {label ?? t('states.loading')}
      {/* Inside the status region, so screen readers announce it when it appears. */}
      {slow && <p className="data-state__hint">{t('states.wakingUp')}</p>}
    </div>
  )
}

/**
 * True once loading from the API has taken longer than `SLOW_LOADING_MS`,
 * e.g. while a free-plan server wakes up. Never true with browser storage.
 */
function useSlowLoading(): boolean {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!isSharedData()) return
    const timer = setTimeout(() => setSlow(true), SLOW_LOADING_MS)
    return () => clearTimeout(timer)
  }, [])
  return slow
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="data-state data-state--error" role="alert">
      <p className="data-state__message">{message}</p>
      <p className="data-state__hint">{t('states.retryHint')}</p>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          {t('states.retry')}
        </button>
      )}
    </div>
  )
}
