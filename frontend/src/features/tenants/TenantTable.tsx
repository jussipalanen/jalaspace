import { Link } from 'react-router'
import { useTranslation } from '../../i18n/useTranslation'
import type { TenantLease, TenantRow } from '../../services/tenants'
import { formatDate } from '../../utils/format'

/** Groups current spaces by property, e.g. "Hall 1, Hall 2 · Tampere Hervanta Logistics". */
function groupByProperty(entries: TenantLease[], collator: Intl.Collator) {
  const groups = new Map<string, (string | null)[]>()
  for (const { space, property } of entries) {
    const key = property?.name ?? ''
    groups.set(key, [...(groups.get(key) ?? []), space?.name ?? null])
  }
  return [...groups]
    .map(([property, spaces]) => ({
      property,
      spaces: spaces.toSorted((a, b) => collator.compare(a ?? '', b ?? '')),
    }))
    .toSorted((a, b) => collator.compare(a.property, b.property))
}

export function TenantTable({ rows }: { rows: TenantRow[] }) {
  const { t, locale } = useTranslation()
  const collator = new Intl.Collator(locale, { numeric: true })
  const columns = {
    name: t('tenants.columns.name'),
    type: t('tenants.columns.type'),
    contact: t('tenants.columns.contact'),
    spaces: t('tenants.columns.spaces'),
  }

  return (
    <div className="card table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{columns.name}</th>
            <th scope="col">{columns.type}</th>
            <th scope="col">{columns.contact}</th>
            <th scope="col">{columns.spaces}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ tenant, current, nextUpcoming }) => (
            <tr key={tenant.id}>
              <td className="data-table__main">
                <Link to={`/tenants/${tenant.id}`} className="data-table__primary">
                  {tenant.name}
                </Link>
              </td>
              <td data-label={columns.type}>{t(`tenant.type.${tenant.type}`)}</td>
              <td data-label={columns.contact}>
                <span>
                  {tenant.contactPerson && <span className="data-table__line">{tenant.contactPerson}</span>}
                  <span className="data-table__line">{tenant.email}</span>
                </span>
              </td>
              <td data-label={columns.spaces}>
                {current.length > 0
                  ? groupByProperty(current, collator).map(({ property, spaces }) => (
                      <span key={property} className="data-table__line">
                        {spaces
                          .map((space) => space ?? t('tenants.detail.unknownSpace'))
                          .join(', ')}
                        {property && <span className="data-table__secondary-inline"> · {property}</span>}
                      </span>
                    ))
                  : nextUpcoming
                    ? t('tenants.movingIn', {
                        date: formatDate(nextUpcoming.lease.startDate),
                        space: nextUpcoming.space?.name ?? t('tenants.detail.unknownSpace'),
                      })
                    : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
