import { EmptyState } from '../components/EmptyState/EmptyState'
import { LayoutGridIcon, WrenchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import './DashboardPage.css'

// Statistics will be derived from repository data once persistence is in place.
const statPlaceholders = ['Properties', 'Spaces', 'Occupancy', 'Open maintenance']

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your property portfolio." />

      <section aria-label="Key figures" className="dashboard__stats">
        {statPlaceholders.map((label) => (
          <div key={label} className="card dashboard__stat">
            <p className="dashboard__stat-label">{label}</p>
            <p className="dashboard__stat-value" aria-label="Not available yet">
              —
            </p>
          </div>
        ))}
      </section>

      <div className="dashboard__panels">
        <section className="card dashboard__panel" aria-labelledby="recent-maintenance-title">
          <h2 id="recent-maintenance-title" className="dashboard__panel-title">
            Recent maintenance
          </h2>
          <EmptyState
            icon={WrenchIcon}
            title="No maintenance data yet"
            description="Recent maintenance tasks will appear here."
          />
        </section>
        <section className="card dashboard__panel" aria-labelledby="available-spaces-title">
          <h2 id="available-spaces-title" className="dashboard__panel-title">
            Available spaces
          </h2>
          <EmptyState
            icon={LayoutGridIcon}
            title="No space data yet"
            description="Spaces available for rent will appear here."
          />
        </section>
      </div>
    </>
  )
}
