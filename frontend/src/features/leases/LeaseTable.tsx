import { Link } from 'react-router'
import { PencilIcon } from '../../components/icons'
import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import { formatCurrency } from '../../i18n/format'
import { useTranslation } from '../../i18n/useTranslation'
import type { LeaseRow } from '../../services/leases'
import { leaseStatusTones } from '../../utils/tones'
import { useLeasePeriod } from './LeasePeriod'

export function LeaseTable({ rows }: { rows: LeaseRow[] }) {
  const { t, locale } = useTranslation()
  const period = useLeasePeriod()
  const columns = {
    tenant: t('leases.columns.tenant'),
    space: t('leases.columns.space'),
    period: t('leases.columns.period'),
    rent: t('leases.columns.rent'),
    status: t('leases.columns.status'),
    actions: t('leases.columns.actions'),
  }

  return (
    <div className="card table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{columns.tenant}</th>
            <th scope="col">{columns.space}</th>
            <th scope="col">{columns.period}</th>
            <th scope="col" className="is-numeric">
              {columns.rent}
            </th>
            <th scope="col">{columns.status}</th>
            <th scope="col">
              <span className="visually-hidden">{columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ lease, status, tenant, space, property }) => {
            const tenantName = tenant?.name ?? t('leases.unknownTenant')
            const spaceName = space?.name ?? t('leases.unknownSpace')
            return (
              <tr key={lease.id}>
                <td className="data-table__main">
                  {tenant ? (
                    <Link to={`/tenants/${tenant.id}`} className="data-table__primary">
                      {tenantName}
                    </Link>
                  ) : (
                    <span className="data-table__primary">{tenantName}</span>
                  )}
                </td>
                <td data-label={columns.space}>
                  <span>
                    {space ? <Link to={`/units/${space.id}/edit`}>{spaceName}</Link> : spaceName}
                    {property && <span className="data-table__secondary">{property.name}</span>}
                  </span>
                </td>
                <td data-label={columns.period}>{period(lease)}</td>
                <td data-label={columns.rent} className="is-numeric">
                  {lease.monthlyRentCents === null ? '—' : formatCurrency(lease.monthlyRentCents, locale)}
                </td>
                <td data-label={columns.status}>
                  <StatusBadge tone={leaseStatusTones[status]}>{t(`lease.status.${status}`)}</StatusBadge>
                </td>
                <td className="data-table__action">
                  <Link
                    to={`/leases/${lease.id}/edit`}
                    className="button button--secondary button--small"
                    aria-label={t('leases.editNamed', { tenant: tenantName, space: spaceName })}
                  >
                    <PencilIcon width={14} height={14} />
                    {t('leases.edit')}
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
