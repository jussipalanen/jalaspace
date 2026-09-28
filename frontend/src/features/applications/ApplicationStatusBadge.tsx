import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import { useTranslation } from '../../i18n/useTranslation'
import type { ApplicationStatus } from '../../types/application'
import { applicationStatusTones } from '../../utils/tones'

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation()
  return <StatusBadge tone={applicationStatusTones[status]}>{t(`application.status.${status}`)}</StatusBadge>
}
