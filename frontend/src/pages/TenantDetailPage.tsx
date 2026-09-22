import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { flashState } from '../components/FlashMessage/flash'
import { PencilIcon, PlusIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { StatusBadge } from '../components/StatusBadge/StatusBadge'
import { DeleteTenantDialog } from '../features/tenants/DeleteTenantDialog'
import { RemoveFromSpaceDialog } from '../features/tenants/RemoveFromSpaceDialog'
import { TenantNotFound } from '../features/tenants/TenantNotFound'
import { useTenantData } from '../features/tenants/useTenantData'
import { formatCurrency } from '../i18n/format'
import { useTranslation } from '../i18n/useTranslation'
import { getTenantDetails, type TenantDetails } from '../services/tenantService'
import type { TenantLease } from '../services/tenants'
import { toIsoDate } from '../utils/date'
import { formatDate } from '../utils/format'
import './TenantDetailPage.css'

export function TenantDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const state = useTenantData()

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('tenants.loadError')} onRetry={state.reload} />
  }

  const details = getTenantDetails(state.data, id, toIsoDate(new Date()))
  if (!details) return <TenantNotFound />
  return (
    <TenantDetailsView
      key={details.tenant.id}
      details={details}
      // Keep the page on screen while data reloads after a change, so focus is kept.
      onChanged={() => state.reload({ keepData: true })}
    />
  )
}

function TenantDetailsView({ details, onChanged }: { details: TenantDetails; onChanged: () => void }) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const { tenant, leases, deletion } = details
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [removing, setRemoving] = useState<TenantLease | null>(null)
  const spacesHeading = useRef<HTMLHeadingElement>(null)
  const focusSpacesAfterRemoval = useRef(false)
  const active = [...leases.current, ...leases.upcoming]

  const rent = (cents: number | null) =>
    cents === null
      ? t('tenants.detail.noRent')
      : t('tenants.detail.rent', { rent: formatCurrency(cents, locale) })

  // The removed row and its button disappear, so move keyboard focus to the
  // section heading. This runs after the dialog's own effect, because closing
  // a native <dialog> returns focus to the button that opened it.
  useEffect(() => {
    if (removing !== null || !focusSpacesAfterRemoval.current) return
    focusSpacesAfterRemoval.current = false
    spacesHeading.current?.focus()
  }, [removing])

  const removed = (message: string) => {
    focusSpacesAfterRemoval.current = true
    setRemoving(null)
    onChanged()
    navigate(`/tenants/${tenant.id}`, { replace: true, state: flashState(message) })
  }

  return (
    <>
      <PageHeader
        title={tenant.name}
        description={[t(`tenant.type.${tenant.type}`), tenant.email].join(' · ')}
        actions={
          <>
            <Link to={`/tenants/${tenant.id}/edit`} className="button button--secondary">
              <PencilIcon width={16} height={16} />
              {t('tenants.detail.edit')}
            </Link>
            <button
              type="button"
              className="button button--secondary button--danger-text"
              onClick={() => setDeleteOpen(true)}
            >
              <TrashIcon width={16} height={16} />
              {t('tenants.detail.delete')}
            </button>
          </>
        }
      />

      <section className="section" aria-labelledby="tenant-spaces-title">
        <div className="section__header">
          <h2 id="tenant-spaces-title" ref={spacesHeading} tabIndex={-1} className="section__title">
            {t('tenants.detail.spaces')}
          </h2>
          <Link
            to={`/leases/new?tenant=${tenant.id}&returnTo=${encodeURIComponent(`/tenants/${tenant.id}`)}`}
            className="button button--secondary"
          >
            <PlusIcon width={16} height={16} />
            {t('tenants.detail.assign')}
          </Link>
        </div>
        {active.length === 0 ? (
          <p className="card section__empty">{t('tenants.detail.noSpaces')}</p>
        ) : (
          <ul className="card tenant-spaces">
            {active.map((entry) => {
              const upcoming = leases.upcoming.includes(entry)
              const spaceName = entry.space?.name ?? t('tenants.detail.unknownSpace')
              return (
                <li key={entry.lease.id} className="tenant-spaces__item">
                  <div className="tenant-spaces__main">
                    <p className="tenant-spaces__title">
                      {entry.space ? (
                        <Link to={`/units/${entry.space.id}/edit`}>{spaceName}</Link>
                      ) : (
                        spaceName
                      )}
                      {entry.property && (
                        <>
                          {' · '}
                          <Link to={`/properties/${entry.property.id}`}>{entry.property.name}</Link>
                        </>
                      )}
                    </p>
                    <p className="tenant-spaces__meta">
                      {[
                        // A fixed-term lease shows its period; an open-ended one when it started.
                        entry.lease.endDate
                          ? t('tenants.detail.period', {
                              start: formatDate(entry.lease.startDate),
                              end: formatDate(entry.lease.endDate),
                            })
                          : upcoming
                            ? t('tenants.detail.startsOn', { date: formatDate(entry.lease.startDate) })
                            : t('tenants.detail.since', { date: formatDate(entry.lease.startDate) }),
                        rent(entry.lease.monthlyRentCents),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className="tenant-spaces__actions">
                    {upcoming && <StatusBadge tone="info">{t('tenants.detail.upcoming')}</StatusBadge>}
                    <Link
                      to={`/leases/${entry.lease.id}/edit?returnTo=${encodeURIComponent(`/tenants/${tenant.id}`)}`}
                      className="button button--secondary"
                      aria-label={t('tenants.detail.editLeaseNamed', { space: spaceName })}
                    >
                      <PencilIcon width={16} height={16} />
                      {t('tenants.detail.editLease')}
                    </Link>
                    <button
                      type="button"
                      className="button button--secondary button--danger-text"
                      aria-label={t('tenants.detail.remove', { space: spaceName })}
                      onClick={() => setRemoving(entry)}
                    >
                      <TrashIcon width={16} height={16} />
                      {t('tenants.detail.removeShort')}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card tenant-details" aria-labelledby="tenant-details-title">
        <h2 id="tenant-details-title" className="section__title">
          {t('tenants.detail.details')}
        </h2>
        <dl className="detail-list">
          <dt>{t('tenants.form.fields.type')}</dt>
          <dd>{t(`tenant.type.${tenant.type}`)}</dd>
          {tenant.type === 'company' && (
            <>
              <dt>{t('tenants.detail.contactPerson')}</dt>
              <dd>{tenant.contactPerson ?? t('tenants.detail.notSet')}</dd>
            </>
          )}
          <dt>{t('tenants.detail.email')}</dt>
          <dd>
            <a href={`mailto:${tenant.email}`}>{tenant.email}</a>
          </dd>
          <dt>{t('tenants.detail.phone')}</dt>
          <dd>
            {tenant.phone ? (
              <a href={`tel:${tenant.phone.replace(/[^\d+]/g, '')}`}>{tenant.phone}</a>
            ) : (
              t('tenants.detail.notSet')
            )}
          </dd>
          <dt>{t('tenants.detail.notes')}</dt>
          <dd className="tenant-details__notes">{tenant.notes || t('tenants.detail.noNotes')}</dd>
          <dt>{t('tenants.detail.created')}</dt>
          <dd>{formatDate(tenant.createdAt)}</dd>
          <dt>{t('tenants.detail.updated')}</dt>
          <dd>{formatDate(tenant.updatedAt)}</dd>
        </dl>
      </section>

      <section className="section" aria-labelledby="tenant-past-title">
        <div className="section__header">
          <h2 id="tenant-past-title" className="section__title">
            {t('tenants.detail.pastLeases')}
          </h2>
        </div>
        {leases.past.length === 0 ? (
          <p className="card section__empty">{t('tenants.detail.noPastLeases')}</p>
        ) : (
          <PastLeaseTable entries={leases.past} />
        )}
      </section>

      <DeleteTenantDialog
        open={deleteOpen}
        tenant={tenant}
        deletion={deletion}
        onClose={() => setDeleteOpen(false)}
        onBlocked={onChanged}
      />
      <RemoveFromSpaceDialog
        tenant={tenant}
        entry={removing}
        onClose={() => setRemoving(null)}
        onRemoved={removed}
      />
    </>
  )
}

function PastLeaseTable({ entries }: { entries: TenantLease[] }) {
  const { t, locale } = useTranslation()
  const columns = {
    space: t('tenants.detail.leaseColumns.space'),
    property: t('tenants.detail.leaseColumns.property'),
    period: t('tenants.detail.leaseColumns.period'),
    rent: t('tenants.detail.leaseColumns.rent'),
  }
  return (
    <div className="card table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{columns.space}</th>
            <th scope="col">{columns.property}</th>
            <th scope="col">{columns.period}</th>
            <th scope="col" className="is-numeric">
              {columns.rent}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ lease, space, property }) => (
            <tr key={lease.id}>
              <td className="data-table__main">
                <span className="data-table__primary">
                  {space?.name ?? t('tenants.detail.unknownSpace')}
                </span>
              </td>
              <td data-label={columns.property}>
                {property ? <Link to={`/properties/${property.id}`}>{property.name}</Link> : '—'}
              </td>
              <td data-label={columns.period}>
                {t('tenants.detail.period', {
                  start: formatDate(lease.startDate),
                  end: lease.endDate ? formatDate(lease.endDate) : '',
                })}
              </td>
              <td data-label={columns.rent} className="is-numeric">
                {lease.monthlyRentCents === null ? '—' : formatCurrency(lease.monthlyRentCents, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
