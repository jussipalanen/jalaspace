import { StatCard } from '../../components/StatCard/StatCard'
import type { DashboardStats as Stats } from '../../services/dashboard'
import { formatCount } from '../../utils/format'

export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <section aria-label="Key figures" className="dashboard__stats">
      <StatCard
        label="Properties"
        value={String(stats.propertyCount)}
        detail={`In ${formatCount(stats.cityCount, 'city', 'cities')}`}
        to="/properties"
      />
      <StatCard
        label="Spaces"
        value={String(stats.spaceCount)}
        detail={`${stats.availableSpaceCount} available`}
        to="/units"
      />
      <StatCard
        label="Occupancy"
        value={stats.occupancyPercent === null ? '—' : `${stats.occupancyPercent}%`}
        detail={`${stats.occupiedSpaceCount} of ${formatCount(stats.spaceCount, 'space')} occupied`}
        to="/units?status=occupied"
      />
      <StatCard
        label="Open maintenance"
        value={String(stats.openMaintenanceCount)}
        detail={`${stats.highPriorityOpenCount} high priority`}
        to="/maintenance"
      />
    </section>
  )
}
