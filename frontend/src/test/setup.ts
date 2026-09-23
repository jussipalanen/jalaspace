import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// jsdom has no <dialog> methods; mimic the open/close behaviour for component tests.
// Real focus handling and Escape are covered by the Playwright tests.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}

// Unit tests never use the network. Tests that need an API stub `fetch` themselves
// (vi.stubGlobal); anything else fails loudly instead of reaching a real server.
// Installed before every test, because vi.unstubAllGlobals() in a test removes it.
beforeEach(() => {
  vi.stubGlobal('fetch', () =>
    Promise.reject(new Error('Unit tests must not call the network; stub fetch in the test.')),
  )
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
