import { StatCard } from '../../components/StatCard/StatCard'
import { formatNumber, formatPercent } from '../../i18n/format'
import { useTranslation } from '../../i18n/useTranslation'
import type { DashboardStats as Stats } from '../../services/dashboard'

export function DashboardStats({ stats }: { stats: Stats }) {
  const { t, locale } = useTranslation()

  return (
    <section aria-label={t('dashboard.keyFigures')} className="dashboard__stats">
      <StatCard
        label={t('dashboard.stats.properties')}
        value={formatNumber(stats.propertyCount, locale)}
        detail={t('dashboard.stats.inCities', { count: stats.cityCount })}
        to="/properties"
      />
      <StatCard
        label={t('dashboard.stats.spaces')}
        value={formatNumber(stats.spaceCount, locale)}
        detail={t('dashboard.stats.available', { count: stats.availableSpaceCount })}
        to="/units"
      />
      <StatCard
        label={t('dashboard.stats.occupancy')}
        value={
          stats.occupancyPercent === null ? '—' : formatPercent(stats.occupancyPercent, locale)
        }
        detail={t('dashboard.stats.spacesOccupied', {
          occupied: stats.occupiedSpaceCount,
          count: stats.spaceCount,
        })}
        to="/units?status=occupied"
      />
      <StatCard
        label={t('dashboard.stats.openMaintenance')}
        value={formatNumber(stats.openMaintenanceCount, locale)}
        detail={t('dashboard.stats.highPriority', { count: stats.highPriorityOpenCount })}
        to="/maintenance"
      />
    </section>
  )
}
