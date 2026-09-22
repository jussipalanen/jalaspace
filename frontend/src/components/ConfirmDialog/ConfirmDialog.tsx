import { useEffect, useId, useRef, type ReactNode } from 'react'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  cancelLabel: string
  onCancel: () => void
  /** Omit to show an informational dialog with only the cancel (close) button. */
  confirm?: {
    label: string
    busyLabel: string
    busy: boolean
    onConfirm: () => void
  }
  error?: string | null
}

/**
 * Modal confirmation built on the native <dialog> element, which provides
 * focus containment, Escape to close and an inert background.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  cancelLabel,
  onCancel,
  confirm,
  error,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(event) => {
        // Escape: let React state drive closing so it stays in sync.
        event.preventDefault()
        if (!confirm?.busy) onCancel()
      }}
    >
      <h2 id={titleId} className="confirm-dialog__title">
        {title}
      </h2>
      <div id={bodyId} className="confirm-dialog__body">
        {children}
      </div>
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      <div className="confirm-dialog__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          disabled={confirm?.busy}
          autoFocus
        >
          {cancelLabel}
        </button>
        {confirm && (
          <button
            type="button"
            className="button button--danger"
            onClick={confirm.onConfirm}
            disabled={confirm.busy}
          >
            {confirm.busy ? confirm.busyLabel : confirm.label}
          </button>
        )}
      </div>
    </dialog>
  )
}
