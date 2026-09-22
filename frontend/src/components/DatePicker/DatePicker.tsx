import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import type { IsoDate } from '../../types/common'
import { calendarWeeks, isoWeekday, shiftIsoDate, toIsoDate } from '../../utils/date'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons'
import './DatePicker.css'

interface DatePickerProps {
  /** The currently entered date, or `null` when the field is empty or invalid. */
  value: IsoDate | null
  onSelect: (value: IsoDate) => void
  /** Lower-case field name used in the button and dialog labels, e.g. "due date". */
  field: string
}

const utc = (value: IsoDate) => new Date(`${value}T00:00:00Z`)

/**
 * Calendar button for a date text field. The field keeps the typed
 * `d.m.yyyy` format; the calendar only helps to choose a date. Weeks start on
 * Monday. Arrow keys move by day and week, Page Up/Down by month, Home/End to
 * the start/end of the week, and Escape closes.
 */
export function DatePicker({ value, onSelect, field }: DatePickerProps) {
  const { t, locale } = useTranslation()
  const dialogId = useId()
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState<IsoDate>(() => toIsoDate(new Date()))
  const moveFocus = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const grid = useRef<HTMLTableElement>(null)
  const today = toIsoDate(new Date())

  const formats = useMemo(
    () => ({
      month: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      day: new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }),
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }),
    }),
    [locale],
  )
  // 2024-01-01 was a Monday.
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const date = utc(`2024-01-0${index + 1}`)
    return { short: formats.weekdayShort.format(date), long: formats.weekdayLong.format(date) }
  })

  // Move keyboard focus to the focused day after opening or keyboard navigation,
  // but not after the month buttons, so they keep focus for repeated use.
  useEffect(() => {
    if (!open || !moveFocus.current) return
    moveFocus.current = false
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus()
  }, [open, focused])

  // Close when clicking or tapping outside the picker.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const close = () => {
    setOpen(false)
    toggle.current?.focus()
  }

  const openCalendar = () => {
    setFocused(value ?? today)
    moveFocus.current = true
    setOpen(true)
  }

  const select = (date: IsoDate) => {
    onSelect(date)
    close()
  }

  const onGridKeyDown = (event: KeyboardEvent) => {
    const moves: Record<string, () => IsoDate> = {
      ArrowLeft: () => shiftIsoDate(focused, { days: -1 }),
      ArrowRight: () => shiftIsoDate(focused, { days: 1 }),
      ArrowUp: () => shiftIsoDate(focused, { days: -7 }),
      ArrowDown: () => shiftIsoDate(focused, { days: 7 }),
      Home: () => shiftIsoDate(focused, { days: -isoWeekday(focused) }),
      End: () => shiftIsoDate(focused, { days: 6 - isoWeekday(focused) }),
      PageUp: () => shiftIsoDate(focused, event.shiftKey ? { months: -12 } : { months: -1 }),
      PageDown: () => shiftIsoDate(focused, event.shiftKey ? { months: 12 } : { months: 1 }),
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    moveFocus.current = true
    setFocused(move())
  }

  const month = focused.slice(0, 7)

  return (
    <div
      ref={root}
      className="date-picker"
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          // Keep Escape from also closing a surrounding dialog.
          event.stopPropagation()
          close()
        }
      }}
    >
      <button
        ref={toggle}
        type="button"
        className="button button--secondary date-picker__toggle"
        aria-label={t('common.datePicker.open', { field })}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => (open ? setOpen(false) : openCalendar())}
      >
        <CalendarIcon width={18} height={18} />
      </button>

      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label={t('common.datePicker.dialog', { field })}
          className="date-picker__popover"
        >
          <div className="date-picker__header">
            <button
              type="button"
              className="icon-button"
              aria-label={t('common.datePicker.previousMonth')}
              onClick={() => setFocused(shiftIsoDate(focused, { months: -1 }))}
            >
              <ChevronLeftIcon width={18} height={18} />
            </button>
            <h2 className="date-picker__month" aria-live="polite">
              {formats.month.format(utc(focused))}
            </h2>
            <button
              type="button"
              className="icon-button"
              aria-label={t('common.datePicker.nextMonth')}
              onClick={() => setFocused(shiftIsoDate(focused, { months: 1 }))}
            >
              <ChevronRightIcon width={18} height={18} />
            </button>
          </div>

          <table ref={grid} className="date-picker__grid" onKeyDown={onGridKeyDown}>
            <thead>
              <tr>
                {weekdays.map((weekday) => (
                  <th key={weekday.long} scope="col" abbr={weekday.long}>
                    {weekday.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendarWeeks(focused).map((week) => (
                <tr key={week[0]}>
                  {week.map((date) => {
                    const notes = [
                      date === value ? t('common.datePicker.selected') : null,
                      date === today ? t('common.datePicker.today') : null,
                    ].filter(Boolean)
                    const classes = [
                      'date-picker__day',
                      date.slice(0, 7) !== month && 'is-outside',
                      date === today && 'is-today',
                      date === value && 'is-selected',
                    ].filter(Boolean)
                    return (
                      <td key={date}>
                        <button
                          type="button"
                          className={classes.join(' ')}
                          data-date={date}
                          tabIndex={date === focused ? 0 : -1}
                          aria-label={[formats.day.format(utc(date)), ...notes].join(', ')}
                          aria-pressed={date === value}
                          onClick={() => select(date)}
                        >
                          {Number(date.slice(8))}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
