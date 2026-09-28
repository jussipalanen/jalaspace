import logoUrl from '../assets/jalaspace-logo.svg'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { AskPanel } from '../features/dashboard/AskPanel'
import { AvailableSpaces } from '../features/dashboard/AvailableSpaces'
import { DashboardStats } from '../features/dashboard/DashboardStats'
import { LatestApplications } from '../features/dashboard/LatestApplications'
import { RecentActivity } from '../features/dashboard/RecentActivity'
import { RecentMaintenance } from '../features/dashboard/RecentMaintenance'
import { useDashboard } from '../features/dashboard/useDashboard'
import { useTranslation } from '../i18n/useTranslation'
import './DashboardPage.css'

export function DashboardPage() {
  const { t } = useTranslation()
  const { status, data, summary, reload } = useDashboard()

  return (
    <>
      <PageHeader
        title={t('pages.dashboard.title')}
        description={t('pages.dashboard.description')}
        actions={
          // Decorative: the heading and the sidebar already name the app. The
          // width and height keep the space reserved while the image loads.
          <img className="dashboard__logo" src={logoUrl} alt="" width={499} height={128} />
        }
      />

      {status === 'loading' && <LoadingState label={t('dashboard.loading')} />}

      {status === 'error' && <ErrorState message={t('dashboard.loadError')} onRetry={reload} />}

      {data && <AskPanel data={data} />}

      {summary && (
        <>
          <DashboardStats stats={summary.stats} />
          <div className="dashboard__panels">
            <RecentMaintenance items={summary.recentMaintenance} />
            <AvailableSpaces items={summary.availableSpaces} />
            <LatestApplications items={summary.latestApplications} />
            <RecentActivity items={summary.recentActivity} />
          </div>
        </>
      )}
    </>
  )
}
