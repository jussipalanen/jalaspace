import { useTranslation } from '../../i18n/useTranslation'
import type { Lease } from '../../types/lease'
import { formatDate } from '../../utils/format'

/** "1.1.2026 – 31.12.2026", or "From 1.1.2026, open-ended". */
export function useLeasePeriod() {
  const { t } = useTranslation()
  return (lease: Pick<Lease, 'startDate' | 'endDate'>) =>
    lease.endDate
      ? t('leases.period', { start: formatDate(lease.startDate), end: formatDate(lease.endDate) })
      : t('leases.openEnded', { start: formatDate(lease.startDate) })
}
