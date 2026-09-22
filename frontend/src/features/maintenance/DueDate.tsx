import { useTranslation } from '../../i18n/useTranslation'
import { isMaintenanceOverdue } from '../../services/maintenance'
import type { IsoDate } from '../../types/common'
import type { MaintenanceTask } from '../../types/maintenance'
import { formatDate } from '../../utils/format'
import './DueDate.css'

/** The due date, marked when the task is overdue. */
export function DueDate({
  task,
  today,
  fallback = '—',
}: {
  task: MaintenanceTask
  today: IsoDate
  /** Shown when the task has no due date. */
  fallback?: string
}) {
  const { t } = useTranslation()
  if (!task.dueDate) return <>{fallback}</>
  const date = formatDate(task.dueDate)
  if (!isMaintenanceOverdue(task, today)) return <>{date}</>
  return (
    <span className="maintenance-overdue">
      <span aria-hidden="true">
        {date} · {t('maintenance.overdue')}
      </span>
      <span className="visually-hidden">{t('maintenance.dueAccessible', { date })}</span>
    </span>
  )
}
