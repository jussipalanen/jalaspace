import type { AddressInfo } from 'node:net'
import type { Express } from 'express'
import { afterEach } from 'vitest'

const servers: { close: () => void }[] = []

afterEach(() => {
  for (const server of servers.splice(0)) server.close()
})

/** Starts the app on a free port and returns its base URL; stopped after each test. */
export async function serve(app: Express): Promise<string> {
  const server = app.listen(0, '127.0.0.1')
  servers.push(server)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const { port } = server.address() as AddressInfo
  return `http://127.0.0.1:${port}`
}
