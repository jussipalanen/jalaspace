import { Link } from 'react-router'
import { useTranslation } from '../../i18n/useTranslation'
import type { MaintenanceRow } from '../../services/maintenance'
import { toIsoDate } from '../../utils/date'
import { DueDate } from './DueDate'
import { MaintenanceStatusBadge, PriorityBadge } from './MaintenanceBadges'

export function MaintenanceTable({ rows }: { rows: MaintenanceRow[] }) {
  const { t } = useTranslation()
  const today = toIsoDate(new Date())
  const columns = {
    title: t('maintenance.columns.title'),
    property: t('maintenance.columns.property'),
    space: t('maintenance.columns.space'),
    category: t('maintenance.columns.category'),
    priority: t('maintenance.columns.priority'),
    status: t('maintenance.columns.status'),
    dueDate: t('maintenance.columns.dueDate'),
  }

  return (
    <div className="card table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{columns.title}</th>
            <th scope="col">{columns.property}</th>
            <th scope="col">{columns.space}</th>
            <th scope="col">{columns.category}</th>
            <th scope="col">{columns.priority}</th>
            <th scope="col">{columns.status}</th>
            <th scope="col">{columns.dueDate}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ task, property, space }) => (
            <tr key={task.id}>
              <td className="data-table__main">
                <Link to={`/maintenance/${task.id}`} className="data-table__primary">
                  {task.title}
                </Link>
              </td>
              <td data-label={columns.property}>
                {property ? <Link to={`/properties/${property.id}`}>{property.name}</Link> : '—'}
              </td>
              <td data-label={columns.space}>{space ? space.name : t('maintenance.commonArea')}</td>
              <td data-label={columns.category}>{t(`maintenance.category.${task.category}`)}</td>
              <td data-label={columns.priority}>
                <PriorityBadge priority={task.priority} />
              </td>
              <td data-label={columns.status}>
                <MaintenanceStatusBadge status={task.status} />
              </td>
              <td data-label={columns.dueDate}>
                <DueDate task={task} today={today} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
