import { createApp } from './app.ts'
import { ConfigError, loadConfig } from './config.ts'
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

const server = createApp().listen(config.port, config.host, () => {
  console.log(`JalaSpace API ${VERSION} listening on http://${config.host}:${config.port}`)
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
