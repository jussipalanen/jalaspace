import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import type { IsoDate } from '../../types/common'
import { calendarWeeks, isoWeekday, shiftIsoDate, toIsoDate } from '../../utils/date'
import type { FormControlProps } from '../FormField/FormField'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons'
import './DateInput.css'

interface DateInputProps {
  /** Accessibility props from the surrounding FormField. */
  control: FormControlProps
  /** The text in the field, e.g. `30.9.2026`. */
  text: string
  onTextChange: (text: string) => void
  /** The date the text represents, or `null` when it is empty or invalid. */
  value: IsoDate | null
  /** Called when a day is chosen in the calendar. */
  onSelect: (value: IsoDate) => void
  /** Lower-case field name used in the button and dialog labels, e.g. "due date". */
  field: string
  placeholder?: string
}

const utc = (value: IsoDate) => new Date(`${value}T00:00:00Z`)

/**
 * Date text field with a calendar. The text keeps the `d.m.yyyy` format in
 * every language, which a native date input cannot guarantee. Clicking the
 * field or the calendar button opens the calendar; typing still works and the
 * calendar follows a complete date. In the calendar, weeks start on Monday;
 * arrow keys move by day and week, Page Up/Down by month, Home/End to the
 * start/end of the week, and Escape closes.
 */
export function DateInput({
  control,
  text,
  onTextChange,
  value,
  onSelect,
  field,
  placeholder,
}: DateInputProps) {
  const { t, locale } = useTranslation()
  const dialogId = useId()
  const today = toIsoDate(new Date())
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState<IsoDate>(value ?? today)
  const [shownValue, setShownValue] = useState(value)
  const moveFocus = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const grid = useRef<HTMLTableElement>(null)

  // Show the month of a newly typed date (state adjusted during render, no effect needed).
  if (value !== shownValue) {
    setShownValue(value)
    if (value) setFocused(value)
  }

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

  // Move keyboard focus to the focused day only when asked (calendar button,
  // Arrow Down or keyboard navigation), so typing and the month buttons keep focus.
  useEffect(() => {
    if (!open || !moveFocus.current) return
    moveFocus.current = false
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus()
  }, [open, focused])

  // Close when clicking or tapping outside the field and calendar.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const openCalendar = (focusCalendar: boolean) => {
    setFocused(value ?? today)
    moveFocus.current = focusCalendar
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    input.current?.focus()
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
      className="date-input"
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          // Keep Escape from also closing a surrounding dialog.
          event.stopPropagation()
          close()
        }
      }}
      onBlur={(event) => {
        // Close when keyboard focus leaves the field and the calendar.
        if (open && !root.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <input
        {...control}
        ref={input}
        className="field__input"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => {
          if (!open) openCalendar(false)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (open) grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus()
            else openCalendar(true)
          }
        }}
        onChange={(event) => onTextChange(event.target.value)}
      />
      <button
        type="button"
        className="button button--secondary date-input__toggle"
        aria-label={t('common.datePicker.open', { field })}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => (open ? setOpen(false) : openCalendar(true))}
      >
        <CalendarIcon width={18} height={18} />
      </button>

      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label={t('common.datePicker.dialog', { field })}
          className="date-input__popover"
          // Keep focus in the field while clicking, so the calendar does not close
          // before the click lands (Safari does not focus clicked buttons).
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="date-input__header">
            <button
              type="button"
              className="icon-button"
              aria-label={t('common.datePicker.previousMonth')}
              onClick={() => setFocused(shiftIsoDate(focused, { months: -1 }))}
            >
              <ChevronLeftIcon width={18} height={18} />
            </button>
            <h2 className="date-input__month" aria-live="polite">
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

          <table ref={grid} className="date-input__grid" onKeyDown={onGridKeyDown}>
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
                      'date-input__day',
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
