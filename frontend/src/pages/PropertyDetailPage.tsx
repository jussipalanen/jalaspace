import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { BuildingIcon, PencilIcon, PlusIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { StatCard } from '../components/StatCard/StatCard'
import { StatusBadge } from '../components/StatusBadge/StatusBadge'
import { DeletePropertyDialog } from '../features/properties/DeletePropertyDialog'
import { usePropertyDetails } from '../features/properties/usePropertyData'
import { formatArea, formatNumber, formatPercent } from '../i18n/format'
import { useTranslation } from '../i18n/useTranslation'
import type { PropertyDetails } from '../services/propertyService'
import type { Space } from '../types/space'
import type { Tenant } from '../types/tenant'
import { formatDate } from '../utils/format'
import { maintenancePriorityTones, maintenanceStatusTones, spaceStatusTones } from '../utils/tones'
// Reuses the stat grid and item list styles from the dashboard.
import './DashboardPage.css'
import './PropertyDetailPage.css'

export function PropertyDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const details = usePropertyDetails(id)

  if (details.status === 'loading') return <LoadingState />
  if (details.status === 'error') {
    return <ErrorState message={t('properties.detail.loadError')} onRetry={details.reload} />
  }
  if (!details.data) {
    return (
      <EmptyState
        headingLevel="h1"
        icon={BuildingIcon}
        title={t('properties.detail.notFoundTitle')}
        description={t('properties.detail.notFoundDescription')}
      >
        <Link to="/properties" className="button button--secondary">
          {t('properties.detail.back')}
        </Link>
      </EmptyState>
    )
  }
  return <PropertyDetailsView details={details.data} onChanged={details.reload} />
}

function PropertyDetailsView({
  details,
  onChanged,
}: {
  details: PropertyDetails
  onChanged: () => void
}) {
  const { t, locale } = useTranslation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { property, metrics, spaces, tenantsBySpace, openMaintenance, deletion } = details

  return (
    <>
      <PageHeader
        title={property.name}
        description={`${property.address}, ${property.postalCode} ${property.city}`}
        actions={
          <>
            <Link to={`/properties/${property.id}/edit`} className="button button--secondary">
              <PencilIcon width={16} height={16} />
              {t('properties.detail.edit')}
            </Link>
            <button
              type="button"
              className="button button--secondary button--danger-text"
              onClick={() => setDeleteOpen(true)}
            >
              <TrashIcon width={16} height={16} />
              {t('properties.detail.delete')}
            </button>
          </>
        }
      />

      <section aria-label={t('properties.detail.keyFigures')} className="dashboard__stats">
        <StatCard
          label={t('dashboard.stats.spaces')}
          value={formatNumber(metrics.spaceCount, locale)}
          detail={t('dashboard.stats.available', { count: metrics.availableSpaceCount })}
        />
        <StatCard
          label={t('dashboard.stats.occupancy')}
          value={
            metrics.occupancyPercent === null ? '—' : formatPercent(metrics.occupancyPercent, locale)
          }
          detail={t('dashboard.stats.spacesOccupied', {
            occupied: metrics.occupiedSpaceCount,
            count: metrics.spaceCount,
          })}
        />
        <StatCard
          label={t('dashboard.stats.openMaintenance')}
          value={formatNumber(metrics.openMaintenanceCount, locale)}
        />
      </section>

      <section className="card property-details" aria-labelledby="property-details-title">
        <h2 id="property-details-title" className="section__title">
          {t('properties.detail.details')}
        </h2>
        <dl className="detail-list">
          <dt>{t('properties.form.fields.type')}</dt>
          <dd>{t(`properties.type.${property.type}`)}</dd>
          <dt>{t('properties.form.fields.address')}</dt>
          <dd>
            {property.address}, {property.postalCode} {property.city}
          </dd>
          <dt>{t('properties.form.fields.description')}</dt>
          <dd>{property.description || t('properties.detail.noDescription')}</dd>
          <dt>{t('properties.detail.created')}</dt>
          <dd>{formatDate(property.createdAt)}</dd>
          <dt>{t('properties.detail.updated')}</dt>
          <dd>{formatDate(property.updatedAt)}</dd>
        </dl>
      </section>

      <section className="section" aria-labelledby="property-spaces-title">
        <div className="section__header">
          <h2 id="property-spaces-title" className="section__title">
            {t('properties.detail.spaces')}
          </h2>
          <Link to={`/units/new?property=${property.id}`} className="button button--secondary">
            <PlusIcon width={16} height={16} />
            {t('properties.detail.addSpace')}
          </Link>
        </div>
        {spaces.length === 0 ? (
          <p className="card section__empty">{t('properties.detail.noSpaces')}</p>
        ) : (
          <SpaceTable spaces={spaces} tenantsBySpace={tenantsBySpace} />
        )}
      </section>

      <section className="section" aria-labelledby="property-maintenance-title">
        <div className="section__header">
          <h2 id="property-maintenance-title" className="section__title">
            {t('properties.detail.openMaintenance')}
          </h2>
          <div className="section__actions">
            <Link to={`/maintenance?property=${property.id}`} className="button button--secondary">
              {t('properties.detail.viewAllMaintenance')}
            </Link>
            <Link
              to={`/maintenance/new?property=${property.id}`}
              className="button button--secondary"
            >
              <PlusIcon width={16} height={16} />
              {t('properties.detail.addMaintenance')}
            </Link>
          </div>
        </div>
        {openMaintenance.length === 0 ? (
          <p className="card section__empty">{t('properties.detail.noOpenMaintenance')}</p>
        ) : (
          <ul className="card property-maintenance">
            {openMaintenance.map((task) => {
              const space = spaces.find((item) => item.id === task.spaceId)
              const priority = t(`maintenance.priority.${task.priority}`)
              return (
                <li key={task.id} className="dashboard-list__item">
                  <div className="dashboard-list__main">
                    <Link to={`/maintenance/${task.id}`} className="dashboard-list__title">
                      {task.title}
                    </Link>
                    <p className="dashboard-list__meta">
                      {[
                        space?.name,
                        task.dueDate
                          ? t('dashboard.recentMaintenance.due', { date: formatDate(task.dueDate) })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
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
      </section>

      <DeletePropertyDialog
        open={deleteOpen}
        property={property}
        deletion={deletion}
        onClose={() => setDeleteOpen(false)}
        onBlocked={onChanged}
      />
    </>
  )

}

function SpaceTable({
  spaces: rows,
  tenantsBySpace,
}: {
  spaces: Space[]
  tenantsBySpace: Record<string, Tenant>
}) {
  const { t, locale } = useTranslation()
  const columns = {
    name: t('properties.detail.spaceColumns.name'),
    type: t('properties.detail.spaceColumns.type'),
    floor: t('properties.detail.spaceColumns.floor'),
    area: t('properties.detail.spaceColumns.area'),
    rooms: t('properties.detail.spaceColumns.rooms'),
    status: t('properties.detail.spaceColumns.status'),
    tenant: t('properties.detail.spaceColumns.tenant'),
  }
  const collator = new Intl.Collator(locale, { numeric: true })
  return (
    <div className="card table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{columns.name}</th>
            <th scope="col">{columns.type}</th>
            <th scope="col" className="is-numeric">
              {columns.floor}
            </th>
            <th scope="col" className="is-numeric">
              {columns.area}
            </th>
            <th scope="col" className="is-numeric">
              {columns.rooms}
            </th>
            <th scope="col">{columns.status}</th>
            <th scope="col">{columns.tenant}</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .toSorted((a, b) => collator.compare(a.name, b.name))
            .map((space) => (
              <tr key={space.id}>
                <td className="data-table__main">
                  <Link
                    to={`/units/${space.id}/edit`}
                    className="data-table__primary"
                    aria-label={t('spaces.editSpace', { name: space.name })}
                  >
                    {space.name}
                  </Link>
                  {space.features.length > 0 && (
                    <span className="data-table__secondary">
                      {space.features.map((feature) => t(`space.feature.${feature}`)).join(' · ')}
                    </span>
                  )}
                </td>
                <td data-label={columns.type}>{t(`space.type.${space.type}`)}</td>
                <td data-label={columns.floor} className="is-numeric">
                  {space.floor}
                </td>
                <td data-label={columns.area} className="is-numeric">
                  {formatArea(space.areaM2, locale)}
                </td>
                <td data-label={columns.rooms} className="is-numeric">
                  {space.rooms ?? '—'}
                </td>
                <td data-label={columns.status}>
                  <StatusBadge tone={spaceStatusTones[space.status]}>
                    {t(`space.status.${space.status}`)}
                  </StatusBadge>
                </td>
                <td data-label={columns.tenant}>
                  {tenantsBySpace[space.id] ? (
                    <Link to={`/tenants/${tenantsBySpace[space.id]!.id}`}>
                      {tenantsBySpace[space.id]!.name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
