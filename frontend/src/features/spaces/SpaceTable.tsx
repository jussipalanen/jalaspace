import { Link } from 'react-router'
import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import { formatArea } from '../../i18n/format'
import { useTranslation } from '../../i18n/useTranslation'
import type { SpaceRow } from '../../services/spaces'
import { spaceStatusTones } from '../../utils/tones'

export function SpaceTable({ rows }: { rows: SpaceRow[] }) {
  const { t, locale } = useTranslation()
  const columns = {
    name: t('spaces.columns.name'),
    property: t('spaces.columns.property'),
    type: t('spaces.columns.type'),
    floor: t('spaces.columns.floor'),
    area: t('spaces.columns.area'),
    status: t('spaces.columns.status'),
    tenant: t('spaces.columns.tenant'),
  }

  return (
    <div className="card table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{columns.name}</th>
            <th scope="col">{columns.property}</th>
            <th scope="col">{columns.type}</th>
            <th scope="col" className="is-numeric">
              {columns.floor}
            </th>
            <th scope="col" className="is-numeric">
              {columns.area}
            </th>
            <th scope="col">{columns.status}</th>
            <th scope="col">{columns.tenant}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ space, property, tenant }) => (
            <tr key={space.id}>
              <td className="data-table__main">
                <Link
                  to={`/units/${space.id}/edit`}
                  className="data-table__primary"
                  aria-label={t('spaces.editSpace', { name: space.name })}
                >
                  {space.name}
                </Link>
              </td>
              <td data-label={columns.property}>
                {property ? <Link to={`/properties/${property.id}`}>{property.name}</Link> : '—'}
              </td>
              <td data-label={columns.type}>{t(`space.type.${space.type}`)}</td>
              <td data-label={columns.floor} className="is-numeric">
                {space.floor}
              </td>
              <td data-label={columns.area} className="is-numeric">
                {formatArea(space.areaM2, locale)}
              </td>
              <td data-label={columns.status}>
                <StatusBadge tone={spaceStatusTones[space.status]}>
                  {t(`space.status.${space.status}`)}
                </StatusBadge>
              </td>
              <td data-label={columns.tenant}>
                {tenant ? <Link to={`/tenants/${tenant.id}`}>{tenant.name}</Link> : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
