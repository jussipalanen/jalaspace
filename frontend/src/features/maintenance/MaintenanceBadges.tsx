import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import { useTranslation } from '../../i18n/useTranslation'
import type { MaintenancePriority, MaintenanceStatus } from '../../types/maintenance'
import { maintenancePriorityTones, maintenanceStatusTones } from '../../utils/tones'

export function PriorityBadge({ priority }: { priority: MaintenancePriority }) {
  const { t } = useTranslation()
  const label = t(`maintenance.priority.${priority}`)
  return (
    <StatusBadge tone={maintenancePriorityTones[priority]}>
      <span aria-hidden="true">{label}</span>
      <span className="visually-hidden">{t('maintenance.priorityAccessible', { priority: label })}</span>
    </StatusBadge>
  )
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const { t } = useTranslation()
  return (
    <StatusBadge tone={maintenanceStatusTones[status]}>
      {t(`maintenance.status.${status}`)}
    </StatusBadge>
  )
}
