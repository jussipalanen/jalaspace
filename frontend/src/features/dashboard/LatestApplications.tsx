import { Link } from 'react-router'
import { useTranslation } from '../../i18n/useTranslation'
import type { ApplicationSummary } from '../../services/dashboard'
import { formatDate } from '../../utils/format'
import { ApplicationStatusBadge } from '../applications/ApplicationStatusBadge'
import { DashboardPanel, MetaLine, PanelEmpty } from './DashboardPanel'

/** The newest rental applications, so managers notice them right after signing in. */
export function LatestApplications({ items }: { items: ApplicationSummary[] }) {
  const { t } = useTranslation()

  return (
    <DashboardPanel
      id="latest-applications-title"
      title={t('dashboard.latestApplications.title')}
      viewAll={{ to: '/applications', label: t('dashboard.latestApplications.viewAll') }}
    >
      {items.length === 0 ? (
        <PanelEmpty>{t('dashboard.latestApplications.empty')}</PanelEmpty>
      ) : (
        <ul className="dashboard-list">
          {items.map(({ application, space, property }) => (
            <li key={application.id} className="dashboard-list__item">
              <div className="dashboard-list__main">
                <Link to={`/applications/${application.id}`} className="dashboard-list__title">
                  {application.name}
                </Link>
                <MetaLine
                  parts={[
                    space?.name ?? t('applications.unknownSpace'),
                    property?.name,
                    t('dashboard.latestApplications.received', { date: formatDate(application.createdAt) }),
                  ]}
                />
              </div>
              <div className="dashboard-list__badges">
                <ApplicationStatusBadge status={application.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  )
}
