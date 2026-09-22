import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { flashState } from '../components/FlashMessage/flash'
import { PencilIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { DeleteMaintenanceDialog } from '../features/maintenance/DeleteMaintenanceDialog'
import { DueDate } from '../features/maintenance/DueDate'
import { MaintenanceStatusBadge, PriorityBadge } from '../features/maintenance/MaintenanceBadges'
import { MaintenanceNotFound } from '../features/maintenance/MaintenanceNotFound'
import { useMaintenanceData } from '../features/maintenance/useMaintenanceData'
import { useDataLayer } from '../hooks/useDataLayer'
import { useTranslation } from '../i18n/useTranslation'
import { EntityNotFoundError } from '../repositories/Repository'
import {
  changeMaintenanceStatus,
  getMaintenanceDetails,
  type MaintenanceDetails,
} from '../services/maintenanceService'
import type { MaintenanceStatus } from '../types/maintenance'
import { toIsoDate } from '../utils/date'
import { formatDate } from '../utils/format'
import './MaintenanceDetailPage.css'

type StatusAction = 'start' | 'complete' | 'reopen'

const ACTION_STATUS: Record<StatusAction, MaintenanceStatus> = {
  start: 'in_progress',
  complete: 'completed',
  reopen: 'open',
}

const FLASH_KEY = {
  start: 'maintenance.flash.started',
  complete: 'maintenance.flash.completed',
  reopen: 'maintenance.flash.reopened',
} as const

/** The status changes offered for each status; the first one is the main action. */
const ACTIONS_BY_STATUS: Record<MaintenanceStatus, StatusAction[]> = {
  open: ['start', 'complete'],
  in_progress: ['complete'],
  completed: ['reopen'],
}

export function MaintenanceDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const state = useMaintenanceData()

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('maintenance.loadError')} onRetry={state.reload} />
  }

  const details = getMaintenanceDetails(state.data, id)
  if (!details) return <MaintenanceNotFound />
  return <MaintenanceDetailsView key={details.task.id} details={details} />
}

function MaintenanceDetailsView({ details }: { details: MaintenanceDetails }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()
  const { property, space } = details
  // Status changes update the task in place, without reloading the page.
  const [task, setTask] = useState(details.task)
  const [pending, setPending] = useState<StatusAction | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const statusHeading = useRef<HTMLHeadingElement>(null)

  const changeStatus = async (action: StatusAction) => {
    setPending(action)
    setStatusError(null)
    try {
      const updated = await changeMaintenanceStatus(getDataLayer(), task.id, ACTION_STATUS[action])
      setTask(updated)
      navigate(`/maintenance/${task.id}`, {
        replace: true,
        state: flashState(t(FLASH_KEY[action], { title: updated.title })),
      })
      // The clicked button is replaced, so keep keyboard focus in the status section.
      statusHeading.current?.focus()
    } catch (error) {
      setStatusError(
        error instanceof EntityNotFoundError
          ? t('maintenance.form.notFoundError')
          : t('maintenance.detail.statusError'),
      )
    } finally {
      setPending(null)
    }
  }

  const location = [property?.name ?? t('maintenance.detail.unknownProperty'), space?.name ?? t('maintenance.commonArea')]

  return (
    <>
      <PageHeader
        title={task.title}
        description={location.join(' · ')}
        actions={
          <>
            <Link to={`/maintenance/${task.id}/edit`} className="button button--secondary">
              <PencilIcon width={16} height={16} />
              {t('maintenance.detail.edit')}
            </Link>
            <button
              type="button"
              className="button button--secondary button--danger-text"
              onClick={() => setDeleteOpen(true)}
            >
              <TrashIcon width={16} height={16} />
              {t('maintenance.detail.delete')}
            </button>
          </>
        }
      />

      <section className="card maintenance-status" aria-labelledby="maintenance-status-title">
        <div className="maintenance-status__summary">
          <h2
            id="maintenance-status-title"
            ref={statusHeading}
            tabIndex={-1}
            className="section__title"
          >
            {t('maintenance.detail.statusTitle')}
          </h2>
          <div className="maintenance-status__badges">
            <MaintenanceStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          <p className="maintenance-status__description">
            {task.status === 'completed'
              ? t('maintenance.detail.statusDescription.completed', {
                  date: formatDate(task.completedAt ?? task.updatedAt),
                })
              : t(`maintenance.detail.statusDescription.${task.status}`)}
          </p>
        </div>
        <div className="maintenance-status__actions">
          {ACTIONS_BY_STATUS[task.status].map((action, index) => (
            <button
              key={action}
              type="button"
              className={`button ${index === 0 ? 'button--primary' : 'button--secondary'}`}
              disabled={pending !== null}
              onClick={() => void changeStatus(action)}
            >
              {pending === action
                ? t('maintenance.detail.busy')
                : t(`maintenance.detail.actions.${action}`)}
            </button>
          ))}
        </div>
        {statusError && (
          <div className="alert alert--error maintenance-status__error" role="alert">
            {statusError}
          </div>
        )}
      </section>

      <section className="card maintenance-details" aria-labelledby="maintenance-details-title">
        <h2 id="maintenance-details-title" className="section__title">
          {t('maintenance.detail.details')}
        </h2>
        <dl className="detail-list">
          <dt>{t('maintenance.form.fields.propertyId')}</dt>
          <dd>
            {property ? (
              <Link to={`/properties/${property.id}`}>{property.name}</Link>
            ) : (
              t('maintenance.detail.unknownProperty')
            )}
          </dd>
          <dt>{t('maintenance.form.fields.spaceId')}</dt>
          <dd>{space ? space.name : t('maintenance.commonArea')}</dd>
          <dt>{t('maintenance.form.fields.category')}</dt>
          <dd>{t(`maintenance.category.${task.category}`)}</dd>
          <dt>{t('maintenance.form.fields.dueDate')}</dt>
          <dd>
            <DueDate task={task} today={toIsoDate(new Date())} fallback={t('maintenance.detail.noDueDate')} />
          </dd>
          <dt>{t('maintenance.detail.created')}</dt>
          <dd>{formatDate(task.createdAt)}</dd>
          <dt>{t('maintenance.detail.updated')}</dt>
          <dd>{formatDate(task.updatedAt)}</dd>
          {task.completedAt && (
            <>
              <dt>{t('maintenance.detail.completed')}</dt>
              <dd>{formatDate(task.completedAt)}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="card maintenance-details" aria-labelledby="maintenance-description-title">
        <h2 id="maintenance-description-title" className="section__title">
          {t('maintenance.detail.description')}
        </h2>
        <p className="maintenance-details__description">
          {task.description || t('maintenance.detail.noDescription')}
        </p>
      </section>

      <DeleteMaintenanceDialog open={deleteOpen} task={task} onClose={() => setDeleteOpen(false)} />
    </>
  )
}
