import { Link } from 'react-router'
import { useTranslation } from '../../i18n/useTranslation'
import type { ActivityItem, ActivityType } from '../../services/dashboard'
import { formatDate } from '../../utils/format'
import { DashboardPanel, PanelEmpty } from './DashboardPanel'

const markerClass: Record<ActivityType, string> = {
  maintenance_completed: 'activity__marker--success',
  lease_started: 'activity__marker--lease',
  lease_ended: 'activity__marker--muted',
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  const { t } = useTranslation()

  return (
    <DashboardPanel
      id="recent-activity-title"
      title={t('dashboard.activity.title')}
      className="dashboard-panel--wide"
    >
      {items.length === 0 ? (
        <PanelEmpty>{t('dashboard.activity.empty')}</PanelEmpty>
      ) : (
        <ol className="activity">
          {items.map((item) => (
            <li key={item.id} className="activity__item">
              <span className={`activity__marker ${markerClass[item.type]}`} aria-hidden="true" />
              <div className="activity__body">
                <p className="activity__title">
                  {t(`dashboard.activity.types.${item.type}`)}
                  {item.details && (
                    <>
                      {': '}
                      <Link to={item.href}>{item.details}</Link>
                    </>
                  )}
                </p>
              </div>
              <time className="activity__date" dateTime={item.date}>
                {formatDate(item.date)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </DashboardPanel>
  )
}
