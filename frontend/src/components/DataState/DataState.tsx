import './DataState.css'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="data-state" role="status">
      <span className="data-state__spinner" aria-hidden="true" />
      {label}
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="data-state data-state--error" role="alert">
      <p className="data-state__message">{message}</p>
      <p className="data-state__hint">Please try again.</p>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
