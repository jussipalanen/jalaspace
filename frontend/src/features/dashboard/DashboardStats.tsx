import { ChartLegend } from '../../components/RingChart/ChartLegend'
import { RingChart } from '../../components/RingChart/RingChart'
import { StatCard } from '../../components/StatCard/StatCard'
import { formatNumber, formatPercent } from '../../i18n/format'
import { useTranslation } from '../../i18n/useTranslation'
import type { DashboardStats as Stats, SpaceBreakdown } from '../../services/dashboard'
import type { MaintenancePriority } from '../../types/maintenance'

const SPACE_STATES: { key: keyof SpaceBreakdown; color: string }[] = [
  { key: 'occupied', color: 'var(--color-chart-occupied)' },
  { key: 'available', color: 'var(--color-chart-available)' },
  { key: 'reserved', color: 'var(--color-chart-reserved)' },
  { key: 'maintenance', color: 'var(--color-chart-maintenance)' },
]

// Most urgent first, from the darkest step of the ramp.
const PRIORITIES: { key: MaintenancePriority; color: string }[] = [
  { key: 'high', color: 'var(--color-chart-priority-high)' },
  { key: 'medium', color: 'var(--color-chart-priority-medium)' },
  { key: 'low', color: 'var(--color-chart-priority-low)' },
]

export function DashboardStats({ stats }: { stats: Stats }) {
  const { t, locale } = useTranslation()

  const spaces = SPACE_STATES.map(({ key, color }) => ({ key, color, value: stats.spaceBreakdown[key] }))
  const priorities = PRIORITIES.map(({ key, color }) => ({
    key,
    color,
    value: stats.openMaintenanceByPriority[key],
  }))

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
        chart={<RingChart segments={spaces} />}
        legend={
          <ChartLegend
            items={spaces.map(({ key, color, value }) => ({
              key,
              color,
              label: t(`dashboard.stats.spaceStates.${key}`),
              value: formatNumber(value, locale),
            }))}
          />
        }
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
        chart={
          <RingChart
            segments={[
              { key: 'occupied', value: stats.occupiedSpaceCount, color: 'var(--color-chart-occupied)' },
            ]}
            total={stats.spaceCount}
            track="var(--color-chart-track)"
          />
        }
        to="/units?status=occupied"
      />
      <StatCard
        label={t('dashboard.stats.openMaintenance')}
        value={formatNumber(stats.openMaintenanceCount, locale)}
        chart={<RingChart segments={priorities} />}
        legend={
          <ChartLegend
            items={priorities.map(({ key, color, value }) => ({
              key,
              color,
              label: t(`maintenance.priority.${key}`),
              value: formatNumber(value, locale),
            }))}
          />
        }
        to="/maintenance"
      />
    </section>
  )
}
