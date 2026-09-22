import { Link } from 'react-router'
import { formatNumber, formatPercent } from '../../i18n/format'
import { useTranslation } from '../../i18n/useTranslation'
import type { PropertySummary } from '../../services/properties'

export function PropertyTable({ items }: { items: PropertySummary[] }) {
  const { t, locale } = useTranslation()
  const columns = {
    name: t('properties.columns.name'),
    address: t('properties.columns.address'),
    type: t('properties.columns.type'),
    spaces: t('properties.columns.spaces'),
    occupancy: t('properties.columns.occupancy'),
    openMaintenance: t('properties.columns.openMaintenance'),
  }

  return (
    <div className="card table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{columns.name}</th>
            <th scope="col">{columns.address}</th>
            <th scope="col">{columns.type}</th>
            <th scope="col" className="is-numeric">
              {columns.spaces}
            </th>
            <th scope="col" className="is-numeric">
              {columns.occupancy}
            </th>
            <th scope="col" className="is-numeric">
              {columns.openMaintenance}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ property, spaceCount, occupancyPercent, openMaintenanceCount }) => (
            <tr key={property.id}>
              <td className="data-table__main">
                <Link to={`/properties/${property.id}`} className="data-table__primary">
                  {property.name}
                </Link>
              </td>
              <td data-label={columns.address}>
                {property.address}, {property.postalCode} {property.city}
              </td>
              <td data-label={columns.type}>{t(`properties.type.${property.type}`)}</td>
              <td data-label={columns.spaces} className="is-numeric">
                {formatNumber(spaceCount, locale)}
              </td>
              <td data-label={columns.occupancy} className="is-numeric">
                {occupancyPercent === null ? '—' : formatPercent(occupancyPercent, locale)}
              </td>
              <td data-label={columns.openMaintenance} className="is-numeric">
                {formatNumber(openMaintenanceCount, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
