export interface User {
  id: string
  email: string
  name: string
}

export interface Session {
  user: User
  /** ISO 8601 timestamp of when the session was created. */
  createdAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}
