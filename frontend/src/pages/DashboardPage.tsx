import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { AvailableSpaces } from '../features/dashboard/AvailableSpaces'
import { DashboardStats } from '../features/dashboard/DashboardStats'
import { RecentActivity } from '../features/dashboard/RecentActivity'
import { RecentMaintenance } from '../features/dashboard/RecentMaintenance'
import { useDashboard } from '../features/dashboard/useDashboard'
import { useTranslation } from '../i18n/useTranslation'
import './DashboardPage.css'

export function DashboardPage() {
  const { t } = useTranslation()
  const { status, summary, reload } = useDashboard()

  return (
    <>
      <PageHeader title={t('pages.dashboard.title')} description={t('pages.dashboard.description')} />

      {status === 'loading' && <LoadingState label={t('dashboard.loading')} />}

      {status === 'error' && <ErrorState message={t('dashboard.loadError')} onRetry={reload} />}

      {summary && (
        <>
          <DashboardStats stats={summary.stats} />
          <div className="dashboard__panels">
            <RecentMaintenance items={summary.recentMaintenance} />
            <AvailableSpaces items={summary.availableSpaces} />
            <RecentActivity items={summary.recentActivity} />
          </div>
        </>
      )}
    </>
  )
}
