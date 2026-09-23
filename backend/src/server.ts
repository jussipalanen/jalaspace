import { GeminiSuggester } from './ai/gemini.ts'
import { createApp } from './app.ts'
import { ConfigError, loadConfig } from './config.ts'
import { createResetRateLimiter, createWriteRateLimiter } from './limits.ts'
import { resetDemoData } from './domain/demoData.ts'
import { createMemoryStore } from './store/memoryStore.ts'
import { VERSION } from './version.ts'

let config
try {
  config = loadConfig()
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(`Invalid configuration: ${error.message}`)
    process.exit(1)
  }
  throw error
}

const store = createMemoryStore()
if (config.seedDemoData) await resetDemoData(store)

const suggester = config.geminiApiKey
  ? new GeminiSuggester({ apiKey: config.geminiApiKey, model: config.geminiModel })
  : null

const app = createApp({
  store,
  demoData: config.seedDemoData,
  suggester,
  corsOrigins: config.corsOrigins,
  trustProxy: config.trustProxy,
  writeRateLimiter: createWriteRateLimiter(config.writeRateLimit),
  resetRateLimiter: createResetRateLimiter(config.resetRateLimit),
})

const server = app.listen(config.port, config.host, () => {
  const demo = config.seedDemoData ? ' with demo data' : ''
  console.log(`JalaSpace API ${VERSION} listening on http://${config.host}:${config.port}${demo}`)
  console.log(suggester ? `AI suggestions: Gemini (${config.geminiModel})` : 'AI suggestions: off')
})

// Stop accepting connections and let open requests finish, e.g. when Docker stops the container.
function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} received, shutting down`)
  server.close(() => process.exit(0))
  // Do not wait forever for keep-alive connections.
  setTimeout(() => process.exit(0), 5000).unref()
  server.closeIdleConnections()
}

process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
