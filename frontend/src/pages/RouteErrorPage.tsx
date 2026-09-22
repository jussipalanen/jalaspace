import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { EmptyState } from '../components/EmptyState/EmptyState'

/** Shown when rendering a route throws, so a single page error does not blank the app. */
export function RouteErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    if (import.meta.env.DEV) console.error(error)
  }, [error])

  return (
    <div className="route-error">
      <EmptyState
        title="Something went wrong"
        description="This page could not be displayed. Please try again."
      >
        <button
          type="button"
          className="button button--primary"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </EmptyState>
    </div>
  )
}
