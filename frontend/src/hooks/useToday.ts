import { useState } from 'react'
import type { IsoDate } from '../types/common'
import { toIsoDate } from '../utils/date'

/**
 * Today's local calendar date, read once when the component mounts.
 *
 * Reading the clock during render would make renders impure; a page left open
 * past midnight picks up the new date the next time it is opened.
 */
export function useToday(): IsoDate {
  const [today] = useState(() => toIsoDate(new Date()))
  return today
}
