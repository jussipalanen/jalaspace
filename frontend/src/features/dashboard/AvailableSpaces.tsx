import { Link } from 'react-router'
import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import { formatArea } from '../../i18n/format'
import { useTranslation } from '../../i18n/useTranslation'
import { DASHBOARD_LIST_LIMIT, type AvailableSpaceSummary } from '../../services/dashboard'
import { formatDate } from '../../utils/format'
import { DashboardPanel, MetaLine, PanelEmpty } from './DashboardPanel'

export function AvailableSpaces({ items }: { items: AvailableSpaceSummary[] }) {
  const { t, locale } = useTranslation()
  const visible = items.slice(0, DASHBOARD_LIST_LIMIT)

  return (
    <DashboardPanel
      id="available-spaces-title"
      title={t('dashboard.availableSpaces.title')}
      viewAll={{
        to: '/units?status=available',
        label:
          items.length > visible.length
            ? t('dashboard.viewAllCount', { count: items.length })
            : t('dashboard.viewAll'),
      }}
    >
      {items.length === 0 ? (
        <PanelEmpty>{t('dashboard.availableSpaces.empty')}</PanelEmpty>
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
                    t(`space.type.${space.type}`),
                    t('dashboard.availableSpaces.floor', { floor: space.floor }),
                    formatArea(space.areaM2, locale),
                  ]}
                />
              </div>
              <div className="dashboard-list__badges">
                {reservedFrom ? (
                  <StatusBadge tone="info">
                    {t('dashboard.availableSpaces.reservedFrom', { date: formatDate(reservedFrom) })}
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="success">{t('space.status.available')}</StatusBadge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  )
}
