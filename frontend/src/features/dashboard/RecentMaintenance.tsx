import { Link } from 'react-router'
import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import type { MaintenanceSummary } from '../../services/dashboard'
import { formatDate } from '../../utils/format'
import {
  maintenancePriorityLabels,
  maintenancePriorityTones,
  maintenanceStatusLabels,
  maintenanceStatusTones,
} from '../../utils/labels'
import { DashboardPanel, MetaLine, PanelEmpty } from './DashboardPanel'

export function RecentMaintenance({ items }: { items: MaintenanceSummary[] }) {
  return (
    <DashboardPanel
      id="recent-maintenance-title"
      title="Recent maintenance"
      viewAll={{ to: '/maintenance', label: 'View all' }}
    >
      {items.length === 0 ? (
        <PanelEmpty>No maintenance tasks yet.</PanelEmpty>
      ) : (
        <ul className="dashboard-list">
          {items.map(({ task, property, space }) => (
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
                      ? `Due ${formatDate(task.dueDate)}`
                      : null,
                  ]}
                />
              </div>
              <div className="dashboard-list__badges">
                <StatusBadge tone={maintenancePriorityTones[task.priority]}>
                  {maintenancePriorityLabels[task.priority]}
                  <span className="visually-hidden"> priority</span>
                </StatusBadge>
                <StatusBadge tone={maintenanceStatusTones[task.status]}>
                  {maintenanceStatusLabels[task.status]}
                </StatusBadge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  )
}
