// Global styles must load before component styles so components can override shared primitives.
import './styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { getDataProvider } from './config/dataProvider'
import { getDataLayer } from './repositories'
import { startWakingApi } from './services/apiWakeUp'
import { initializeDemoData } from './services/demoDataService'
import { syncAllSpaceStatuses } from './services/leaseService'

async function prepareDemoData(): Promise<void> {
  try {
    const dataLayer = getDataLayer()
    if (dataLayer.demoData) await initializeDemoData(dataLayer.demoData)
    // A lease may have started or ended since the last visit. The API keeps
    // statuses in step itself, and waiting for it here would leave the page
    // blank while a sleeping server wakes up.
    if (getDataProvider() !== 'api') await syncAllSpaceStatuses(dataLayer)
  } catch (error) {
    // The app still renders; pages that need data show their own error state.
    console.error('Unable to prepare demo data', error)
  }
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found')
}

startWakingApi()
await prepareDemoData()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
