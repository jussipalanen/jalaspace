import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ConfirmDialog } from '../components/ConfirmDialog/ConfirmDialog'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { flashState } from '../components/FlashMessage/flash'
import { TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { ApplicationNotFound } from '../features/applications/ApplicationNotFound'
import { ApplicationStatusBadge } from '../features/applications/ApplicationStatusBadge'
import { DeleteApplicationDialog } from '../features/applications/DeleteApplicationDialog'
import { useApplicationData } from '../features/applications/useApplicationData'
import { useDataLayer } from '../hooks/useDataLayer'
import { useTranslation } from '../i18n/useTranslation'
import { ApiRequestError } from '../repositories/api/apiRequest'
import {
  ApplicationStatusChangeError,
  changeApplicationStatus,
  getApplicationDetails,
  type ApplicationDetails,
} from '../services/applicationService'
import type { ApplicationStatus } from '../types/application'
import { saveErrorMessage } from '../utils/apiLimits'
import { toIsoDate } from '../utils/date'
import { formatDate } from '../utils/format'
import './MaintenanceDetailPage.css'
import './ApplicationDetailPage.css'

type StatusAction = 'review' | 'reject' | 'withdraw'

const ACTION_STATUS: Record<StatusAction, ApplicationStatus> = {
  review: 'in_review',
  reject: 'rejected',
  withdraw: 'withdrawn',
}

/**
 * The status changes offered for each status; the first one is the main
 * action. Approving comes with turning the application into a tenant and a lease.
 */
const ACTIONS_BY_STATUS: Record<ApplicationStatus, StatusAction[]> = {
  submitted: ['review', 'reject', 'withdraw'],
  in_review: ['reject', 'withdraw'],
  approved: [],
  rejected: [],
  withdrawn: [],
}

/** Decisions cannot be undone, so they are confirmed first. */
type ConfirmedAction = Exclude<StatusAction, 'review'>

const isConfirmed = (action: StatusAction): action is ConfirmedAction => action !== 'review'

/** The status was changed elsewhere meanwhile: in another tab, or by someone else on the shared API. */
const isConflict = (error: unknown) =>
  error instanceof ApplicationStatusChangeError ||
  (error instanceof ApiRequestError && error.code === 'invalid_status_change')

export function ApplicationDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const state = useApplicationData()

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('applications.loadError')} onRetry={state.reload} />
  }

  const details = getApplicationDetails(state.data, id, toIsoDate(new Date()))
  if (!details) return <ApplicationNotFound />
  return <ApplicationDetailsView key={details.application.id} details={details} />
}

function ApplicationDetailsView({ details }: { details: ApplicationDetails }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()
  const { space, property } = details
  // Status changes update the application in place, without reloading the page.
  const [application, setApplication] = useState(details.application)
  const [pending, setPending] = useState<StatusAction | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<ConfirmedAction | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const statusHeading = useRef<HTMLHeadingElement>(null)
  // Only an open application waits for the space; a decided one keeps its history.
  const spaceUnavailable = details.spaceUnavailable && ACTIONS_BY_STATUS[application.status].length > 0

  const changeStatus = async (action: StatusAction) => {
    setPending(action)
    setStatusError(null)
    try {
      const updated = await changeApplicationStatus(getDataLayer(), application.id, ACTION_STATUS[action])
      setApplication(updated)
      setConfirming(null)
      navigate(`/applications/${application.id}`, {
        replace: true,
        state: flashState(t(`applications.flash.${action}`, { name: updated.name })),
      })
      // The clicked button is replaced, so keep keyboard focus in the status section.
      statusHeading.current?.focus()
    } catch (error) {
      setConfirming(null)
      setStatusError(
        isConflict(error)
          ? t('applications.detail.statusConflict')
          : saveErrorMessage(error, t, t('applications.detail.statusError')),
      )
    } finally {
      setPending(null)
    }
  }

  const describeStatus = () => {
    const { status, decidedAt, createdAt } = application
    if (status === 'submitted') return t('applications.detail.statusDescription.submitted', { date: formatDate(createdAt) })
    if (status === 'in_review') return t('applications.detail.statusDescription.in_review')
    return t(`applications.detail.statusDescription.${status}`, { date: formatDate(decidedAt ?? application.updatedAt) })
  }

  const location = [space?.name ?? t('applications.unknownSpace'), property?.name].filter(Boolean)
  const notSet = <span className="application-details__muted">{t('applications.detail.notSet')}</span>

  return (
    <>
      <PageHeader
        title={application.name}
        description={location.join(' · ')}
        actions={
          <button
            type="button"
            className="button button--secondary button--danger-text"
            onClick={() => setDeleteOpen(true)}
          >
            <TrashIcon width={16} height={16} />
            {t('applications.detail.delete')}
          </button>
        }
      />

      <section className="card maintenance-status" aria-labelledby="application-status-title">
        <div className="maintenance-status__summary">
          <h2 id="application-status-title" ref={statusHeading} tabIndex={-1} className="section__title">
            {t('applications.detail.statusTitle')}
          </h2>
          <div className="maintenance-status__badges">
            <ApplicationStatusBadge status={application.status} />
          </div>
          <p className="maintenance-status__description">{describeStatus()}</p>
        </div>
        {ACTIONS_BY_STATUS[application.status].length > 0 && (
          <div className="maintenance-status__actions">
            {ACTIONS_BY_STATUS[application.status].map((action, index) => (
              <button
                key={action}
                type="button"
                className={`button ${index === 0 ? 'button--primary' : 'button--secondary'}`}
                disabled={pending !== null}
                onClick={() => (isConfirmed(action) ? setConfirming(action) : void changeStatus(action))}
              >
                {pending === action ? t('applications.detail.busy') : t(`applications.detail.actions.${action}`)}
              </button>
            ))}
          </div>
        )}
        {spaceUnavailable && (
          <div className="alert alert--warning maintenance-status__error">{t('applications.detail.spaceUnavailable')}</div>
        )}
        {statusError && (
          <div className="alert alert--error maintenance-status__error" role="alert">
            {statusError}
          </div>
        )}
      </section>

      <div className="application-details">
        <section className="card maintenance-details" aria-labelledby="application-applicant-title">
          <h2 id="application-applicant-title" className="section__title">
            {t('applications.detail.details')}
          </h2>
          <dl className="detail-list">
            <dt>{t('applications.detail.applicantType')}</dt>
            <dd>{t(`tenant.type.${application.applicantType}`)}</dd>
            {application.applicantType === 'company' && (
              <>
                <dt>{t('applications.detail.contactPerson')}</dt>
                <dd>{application.contactPerson ?? notSet}</dd>
              </>
            )}
            <dt>{t('applications.detail.email')}</dt>
            <dd>
              <a href={`mailto:${application.email}`}>{application.email}</a>
            </dd>
            <dt>{t('applications.detail.phone')}</dt>
            <dd>{application.phone ? <a href={`tel:${application.phone.replace(/\s/g, '')}`}>{application.phone}</a> : notSet}</dd>
            <dt>{t('applications.detail.received')}</dt>
            <dd>{formatDate(application.createdAt)}</dd>
            {application.decidedAt && (
              <>
                <dt>{t('applications.detail.decided')}</dt>
                <dd>{formatDate(application.decidedAt)}</dd>
              </>
            )}
          </dl>
        </section>

        <section className="card maintenance-details" aria-labelledby="application-space-title">
          <h2 id="application-space-title" className="section__title">
            {t('applications.detail.spaceTitle')}
          </h2>
          <dl className="detail-list">
            <dt>{t('applications.detail.property')}</dt>
            <dd>{property ? <Link to={`/properties/${property.id}`}>{property.name}</Link> : notSet}</dd>
            <dt>{t('applications.detail.space')}</dt>
            <dd>
              {space ? <Link to={`/units/${space.id}/edit`}>{space.name}</Link> : t('applications.unknownSpace')}
            </dd>
            <dt>{t('applications.detail.desiredStart')}</dt>
            <dd>{formatDate(application.desiredStartDate)}</dd>
          </dl>
        </section>
      </div>

      <section className="card maintenance-details" aria-labelledby="application-message-title">
        <h2 id="application-message-title" className="section__title">
          {t('applications.detail.message')}
        </h2>
        <p className="maintenance-details__description">
          {application.message || t('applications.detail.noMessage')}
        </p>
      </section>

      {confirming && (
        <ConfirmDialog
          open
          title={t(`applications.confirm.${confirming}Title`, { name: application.name })}
          cancelLabel={t('applications.confirm.cancel')}
          onCancel={() => setConfirming(null)}
          confirm={{
            label: t(`applications.confirm.${confirming}Confirm`),
            busyLabel: t('applications.confirm.busy'),
            busy: pending !== null,
            onConfirm: () => void changeStatus(confirming),
          }}
        >
          <p>{t(`applications.confirm.${confirming}Description`)}</p>
        </ConfirmDialog>
      )}

      <DeleteApplicationDialog open={deleteOpen} application={application} onClose={() => setDeleteOpen(false)} />
    </>
  )
}
