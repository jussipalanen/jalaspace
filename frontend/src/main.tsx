// Global styles must load before component styles so components can override shared primitives.
import './styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { getDataLayer } from './repositories'
import { initializeDemoData } from './services/demoDataService'

async function prepareDemoData(): Promise<void> {
  try {
    const { demoData } = getDataLayer()
    if (demoData) await initializeDemoData(demoData)
  } catch (error) {
    // The app still renders; pages that need data show their own error state.
    console.error('Unable to prepare demo data', error)
  }
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found')
}

await prepareDemoData()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
