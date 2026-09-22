import { Link } from 'react-router'
import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import { DASHBOARD_LIST_LIMIT, type AvailableSpaceSummary } from '../../services/dashboard'
import { formatArea, formatDate } from '../../utils/format'
import { spaceTypeLabels } from '../../utils/labels'
import { DashboardPanel, MetaLine, PanelEmpty } from './DashboardPanel'

export function AvailableSpaces({ items }: { items: AvailableSpaceSummary[] }) {
  const visible = items.slice(0, DASHBOARD_LIST_LIMIT)

  return (
    <DashboardPanel
      id="available-spaces-title"
      title="Available spaces"
      viewAll={{
        to: '/units?status=available',
        label: items.length > visible.length ? `View all ${items.length}` : 'View all',
      }}
    >
      {items.length === 0 ? (
        <PanelEmpty>All spaces are occupied or in maintenance.</PanelEmpty>
      ) : (
        <ul className="dashboard-list">
          {visible.map(({ space, property, reservedFrom }) => (
            <li key={space.id} className="dashboard-list__item">
              <div className="dashboard-list__main">
                <p className="dashboard-list__title">
                  {space.name}
                  {property && (
                    <>
                      {' · '}
                      <Link to={`/properties/${property.id}`}>{property.name}</Link>
                    </>
                  )}
                </p>
                <MetaLine
                  parts={[
                    spaceTypeLabels[space.type],
                    `Floor ${space.floor}`,
                    formatArea(space.areaM2),
                  ]}
                />
              </div>
              <div className="dashboard-list__badges">
                {reservedFrom ? (
                  <StatusBadge tone="info">Reserved from {formatDate(reservedFrom)}</StatusBadge>
                ) : (
                  <StatusBadge tone="success">Available</StatusBadge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  )
}
