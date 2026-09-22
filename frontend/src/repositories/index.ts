import { LocalStorageSessionRepository } from './localStorage/LocalStorageSessionRepository'
import type { SessionRepository } from './SessionRepository'

// Single place to swap persistence implementations (e.g. an API-backed repository later).
export const sessionRepository: SessionRepository = new LocalStorageSessionRepository()
