import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; data: T }

/**
 * Runs an async loader on mount and whenever `load` changes, exposing its
 * state and a `reload` function. Results of outdated runs are ignored.
 * Wrap `load` in `useCallback` to avoid reloading on every render.
 */
export function useAsyncData<T>(load: () => Promise<T>): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    load().then(
      (data) => {
        if (!cancelled) setState({ status: 'success', data })
      },
      (error: unknown) => {
        if (import.meta.env.DEV) console.error(error)
        if (!cancelled) setState({ status: 'error', error })
      },
    )

    return () => {
      cancelled = true
    }
  }, [load, attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { ...state, reload }
}
