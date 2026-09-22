/** ISO 8601 timestamp, e.g. `2026-09-22T10:30:00.000Z`. */
export type IsoDateTime = string

/** Calendar date without a time of day, e.g. `2026-09-22`. */
export type IsoDate = string

/** Fields shared by every persisted domain entity. */
export interface Entity {
  id: string
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}
