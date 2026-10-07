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
import { useToday } from '../hooks/useToday'
import { useTranslation } from '../i18n/useTranslation'
import { ApiRequestError } from '../repositories/api/apiRequest'
import {
  ApplicationStatusChangeError,
  approveApplication,
  changeApplicationStatus,
  getApplicationDetails,
  leaseFormPath,
  rejectApplications,
  SpaceUnavailableError,
  type ApplicationDetails,
} from '../services/applicationService'
import type { ApplicationStatus } from '../types/application'
import { saveErrorMessage } from '../utils/apiLimits'
import { formatDate } from '../utils/format'
import './MaintenanceDetailPage.css'
import './ApplicationDetailPage.css'

type StatusAction = 'approve' | 'review' | 'reject' | 'withdraw'

/** The status changes made directly; approving also creates or links a tenant. */
const ACTION_STATUS: Record<Exclude<StatusAction, 'approve'>, ApplicationStatus> = {
  review: 'in_review',
  reject: 'rejected',
  withdraw: 'withdrawn',
}

/** The status changes offered for each status; the first one is the main action. */
const ACTIONS_BY_STATUS: Record<ApplicationStatus, StatusAction[]> = {
  submitted: ['review', 'approve', 'reject', 'withdraw'],
  in_review: ['approve', 'reject', 'withdraw'],
  approved: [],
  rejected: [],
  withdrawn: [],
}

/** Decisions cannot be undone, so they are confirmed first; so is rejecting the other applications. */
type ConfirmedAction = Exclude<StatusAction, 'review'> | 'rejectOthers'

/** The status was changed elsewhere meanwhile: in another tab, or by someone else on the shared API. */
const isConflict = (error: unknown) =>
  error instanceof ApplicationStatusChangeError ||
  (error instanceof ApiRequestError && error.code === 'invalid_status_change')

export function ApplicationDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const state = useApplicationData()
  const today = useToday()

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('applications.loadError')} onRetry={state.reload} />
  }

  const details = getApplicationDetails(state.data, id, today)
  if (!details) return <ApplicationNotFound />
  return <ApplicationDetailsView key={details.application.id} details={details} />
}

function ApplicationDetailsView({ details }: { details: ApplicationDetails }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()
  const { space, property, tenant, hasLease } = details
  // Status changes update the application in place, without reloading the page.
  const [application, setApplication] = useState(details.application)
  const [otherOpen, setOtherOpen] = useState(details.otherOpen)
  const [pending, setPending] = useState<StatusAction | 'rejectOthers' | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<ConfirmedAction | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const statusHeading = useRef<HTMLHeadingElement>(null)
  // Only an open application waits for the space; a decided one keeps its history.
  const isOpen = ACTIONS_BY_STATUS[application.status].length > 0
  const spaceUnavailable = details.spaceUnavailable && isOpen
  // A space that was let, reserved or taken into maintenance cannot be approved for.
  const actions = ACTIONS_BY_STATUS[application.status].filter((action) => action !== 'approve' || !spaceUnavailable)

  const showError = (error: unknown, fallback: string) => {
    setConfirming(null)
    setStatusError(
      isConflict(error)
        ? t('applications.detail.statusConflict')
        : error instanceof SpaceUnavailableError
          ? t('applications.detail.spaceUnavailable')
          : saveErrorMessage(error, t, fallback),
    )
  }

  const changeStatus = async (action: Exclude<StatusAction, 'approve'>) => {
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
      showError(error, t('applications.detail.statusError'))
    } finally {
      setPending(null)
    }
  }

  // Approving continues to the lease form; the lease is created only when it is saved there.
  const approve = async () => {
    setPending('approve')
    setStatusError(null)
    try {
      const result = await approveApplication(getDataLayer(), application.id)
      navigate(leaseFormPath(result.application), {
        state: flashState(t('applications.flash.approved', { name: result.application.name })),
      })
    } catch (error) {
      showError(error, t('applications.detail.statusError'))
      setPending(null)
    }
  }

  const rejectOthers = async () => {
    setPending('rejectOthers')
    setStatusError(null)
    try {
      const count = await rejectApplications(
        getDataLayer(),
        otherOpen.map((other) => other.id),
      )
      setOtherOpen([])
      setConfirming(null)
      navigate(`/applications/${application.id}`, {
        replace: true,
        state: flashState(t('applications.flash.rejectedAll', { count })),
      })
    } catch (error) {
      showError(error, t('applications.detail.statusError'))
    } finally {
      setPending(null)
    }
  }

  const confirm = (action: ConfirmedAction) => {
    if (action === 'approve') void approve()
    else if (action === 'rejectOthers') void rejectOthers()
    else void changeStatus(action)
  }

  const describeStatus = () => {
    const { status, decidedAt, createdAt } = application
    if (status === 'submitted') return t('applications.detail.statusDescription.submitted', { date: formatDate(createdAt) })
    if (status === 'in_review') return t('applications.detail.statusDescription.in_review')
    return t(`applications.detail.statusDescription.${status}`, { date: formatDate(decidedAt ?? application.updatedAt) })
  }

  const location = [space?.name ?? t('applications.unknownSpace'), property?.name].filter(Boolean)
  const notSet = <span className="application-details__muted">{t('applications.detail.notSet')}</span>
  const approved = application.status === 'approved'
  const spaceName = space?.name ?? t('applications.unknownSpace')

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
          {approved && tenant && (
            <p className="maintenance-status__description">
              {t('applications.detail.tenant')}: <Link to={`/tenants/${tenant.id}`}>{tenant.name}</Link>
            </p>
          )}
        </div>
        {actions.length > 0 && (
          <div className="maintenance-status__actions">
            {actions.map((action, index) => (
              <button
                key={action}
                type="button"
                className={`button ${index === 0 ? 'button--primary' : 'button--secondary'}`}
                disabled={pending !== null}
                onClick={() => (action === 'review' ? void changeStatus(action) : setConfirming(action))}
              >
                {pending === action ? t('applications.detail.busy') : t(`applications.detail.actions.${action}`)}
              </button>
            ))}
          </div>
        )}
        {approved && !hasLease && (
          <div className="alert alert--info maintenance-status__error application-lease">
            <span>{t('applications.detail.leaseMissing')}</span>
            <Link to={leaseFormPath(application)} className="button button--primary">
              {t('applications.detail.createLease')}
            </Link>
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

      {approved && otherOpen.length > 0 && (
        <section className="card maintenance-details application-others" aria-labelledby="application-others-title">
          <div className="application-others__header">
            <div>
              <h2 id="application-others-title" className="section__title">
                {t('applications.detail.otherOpen.title')}
              </h2>
              <p className="maintenance-status__description">
                {t('applications.detail.otherOpen.description', { count: otherOpen.length, space: spaceName })}
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              disabled={pending !== null}
              onClick={() => setConfirming('rejectOthers')}
            >
              {pending === 'rejectOthers' ? t('applications.detail.busy') : t('applications.detail.otherOpen.rejectAll')}
            </button>
          </div>
          <ul className="application-others__list">
            {otherOpen.map((other) => (
              <li key={other.id}>
                <Link to={`/applications/${other.id}`}>{other.name}</Link>
                <ApplicationStatusBadge status={other.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {confirming === 'approve' && (
        <ConfirmDialog
          open
          title={t('applications.confirm.approveTitle', { name: application.name })}
          cancelLabel={t('applications.confirm.cancel')}
          onCancel={() => setConfirming(null)}
          confirm={{
            label: t('applications.confirm.approveConfirm'),
            busyLabel: t('applications.confirm.busy'),
            busy: pending !== null,
            onConfirm: () => confirm('approve'),
            tone: 'primary',
          }}
        >
          <p>
            {tenant
              ? t('applications.confirm.approveExisting', { tenant: tenant.name, email: tenant.email })
              : t('applications.confirm.approveNew', { name: application.name })}
          </p>
          <p>{t('applications.confirm.approveNext')}</p>
        </ConfirmDialog>
      )}

      {confirming === 'rejectOthers' && (
        <ConfirmDialog
          open
          title={t('applications.confirm.rejectAllTitle', { count: otherOpen.length, space: spaceName })}
          cancelLabel={t('applications.confirm.cancel')}
          onCancel={() => setConfirming(null)}
          confirm={{
            label: t('applications.confirm.rejectAllConfirm'),
            busyLabel: t('applications.confirm.busy'),
            busy: pending !== null,
            onConfirm: () => confirm('rejectOthers'),
          }}
        >
          <p>{t('applications.confirm.rejectAllDescription')}</p>
        </ConfirmDialog>
      )}

      {(confirming === 'reject' || confirming === 'withdraw') && (
        <ConfirmDialog
          open
          title={t(`applications.confirm.${confirming}Title`, { name: application.name })}
          cancelLabel={t('applications.confirm.cancel')}
          onCancel={() => setConfirming(null)}
          confirm={{
            label: t(`applications.confirm.${confirming}Confirm`),
            busyLabel: t('applications.confirm.busy'),
            busy: pending !== null,
            onConfirm: () => confirm(confirming),
          }}
        >
          <p>{t(`applications.confirm.${confirming}Description`)}</p>
        </ConfirmDialog>
      )}

      <DeleteApplicationDialog open={deleteOpen} application={application} onClose={() => setDeleteOpen(false)} />
    </>
  )
}
