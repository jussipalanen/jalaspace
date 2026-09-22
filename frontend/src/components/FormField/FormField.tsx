import type { ReactNode } from 'react'

/** Accessibility props for the control rendered inside a FormField. */
export interface FormControlProps {
  id: string
  'aria-invalid'?: true
  'aria-required'?: true
  'aria-describedby'?: string
}

interface FormFieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (control: FormControlProps) => ReactNode
}

/**
 * Labelled form field. The rendered control receives its id and ARIA wiring,
 * so hints and error messages are announced with it.
 */
export function FormField({ id, label, hint, error, required, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ')

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}
