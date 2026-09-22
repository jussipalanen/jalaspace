import type { IsoDate, IsoDateTime } from './common'

/** Editable details of the signed-in user. The email comes from the session and is read-only. */
export interface Profile {
  firstName: string
  lastName: string
  /** Optional calendar date, e.g. `1990-09-22`. */
  birthDate: IsoDate | null
  updatedAt: IsoDateTime
}
