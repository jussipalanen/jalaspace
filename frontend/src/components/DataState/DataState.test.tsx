import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../i18n/I18nProvider'
import { LoadingState, SLOW_LOADING_MS } from './DataState'

const WAKING_UP = 'Waking up the demo server. After a quiet period this can take up to a minute.'

const renderLoading = () =>
  render(
    <I18nProvider>
      <LoadingState label="Loading properties…" />
    </I18nProvider>,
  )

describe('LoadingState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('explains a slow load from the API as the server waking up', () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'api')
    renderLoading()

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Loading properties…')
    act(() => vi.advanceTimersByTime(SLOW_LOADING_MS - 1))
    expect(status).not.toHaveTextContent(WAKING_UP)

    act(() => vi.advanceTimersByTime(1))
    expect(status).toHaveTextContent(WAKING_UP)
  })

  it('never mentions a server when the data is in the browser', () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'localStorage')
    renderLoading()

    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByRole('status')).not.toHaveTextContent(WAKING_UP)
  })

  it('stops waiting when loading finishes first', () => {
    vi.stubEnv('VITE_DATA_PROVIDER', 'api')
    const { unmount } = renderLoading()

    unmount()
    // No update after unmounting, which React would report as a warning.
    expect(() => act(() => vi.advanceTimersByTime(SLOW_LOADING_MS))).not.toThrow()
    expect(vi.getTimerCount()).toBe(0)
  })
})
