import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { AvailableSpaces } from '../features/dashboard/AvailableSpaces'
import { DashboardStats } from '../features/dashboard/DashboardStats'
import { RecentActivity } from '../features/dashboard/RecentActivity'
import { RecentMaintenance } from '../features/dashboard/RecentMaintenance'
import { useDashboard } from '../features/dashboard/useDashboard'
import './DashboardPage.css'

export function DashboardPage() {
  const dashboard = useDashboard()

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your property portfolio." />

      {dashboard.status === 'loading' && <LoadingState label="Loading dashboard…" />}

      {dashboard.status === 'error' && (
        <ErrorState message="Unable to load the dashboard." onRetry={dashboard.reload} />
      )}

      {dashboard.status === 'success' && (
        <>
          <DashboardStats stats={dashboard.data.stats} />
          <div className="dashboard__panels">
            <RecentMaintenance items={dashboard.data.recentMaintenance} />
            <AvailableSpaces items={dashboard.data.availableSpaces} />
            <RecentActivity items={dashboard.data.recentActivity} />
          </div>
        </>
      )}
    </>
  )
}
