import { Link } from 'react-router'
import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import { useTranslation } from '../../i18n/useTranslation'
import type { MaintenanceSummary } from '../../services/dashboard'
import { formatDate } from '../../utils/format'
import { maintenancePriorityTones, maintenanceStatusTones } from '../../utils/tones'
import { DashboardPanel, MetaLine, PanelEmpty } from './DashboardPanel'

export function RecentMaintenance({ items }: { items: MaintenanceSummary[] }) {
  const { t } = useTranslation()

  return (
    <DashboardPanel
      id="recent-maintenance-title"
      title={t('dashboard.recentMaintenance.title')}
      viewAll={{ to: '/maintenance', label: t('dashboard.viewAll') }}
    >
      {items.length === 0 ? (
        <PanelEmpty>{t('dashboard.recentMaintenance.empty')}</PanelEmpty>
      ) : (
        <ul className="dashboard-list">
          {items.map(({ task, property, space }) => {
            const priority = t(`maintenance.priority.${task.priority}`)
            return (
              <li key={task.id} className="dashboard-list__item">
                <div className="dashboard-list__main">
                  <Link to={`/maintenance/${task.id}`} className="dashboard-list__title">
                    {task.title}
                  </Link>
                  <MetaLine
                    parts={[
                      property?.name,
                      space?.name,
                      task.status !== 'completed' && task.dueDate
                        ? t('dashboard.recentMaintenance.due', { date: formatDate(task.dueDate) })
                        : null,
                    ]}
                  />
                </div>
                <div className="dashboard-list__badges">
                  <StatusBadge tone={maintenancePriorityTones[task.priority]}>
                    <span aria-hidden="true">{priority}</span>
                    <span className="visually-hidden">
                      {t('maintenance.priorityAccessible', { priority })}
                    </span>
                  </StatusBadge>
                  <StatusBadge tone={maintenanceStatusTones[task.status]}>
                    {t(`maintenance.status.${task.status}`)}
                  </StatusBadge>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </DashboardPanel>
  )
}
