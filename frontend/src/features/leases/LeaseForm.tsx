import { useId, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { DateInput } from '../../components/DateInput/DateInput'
import { FormField } from '../../components/FormField/FormField'
import { useTranslation } from '../../i18n/useTranslation'
import { EntityNotFoundError } from '../../repositories/Repository'
import { LeaseValidationError } from '../../services/leaseService'
import {
  getLeaseStatus,
  MONTHLY_RENT_MAX_EUROS,
  validateLeaseForm,
  type LeaseFormErrors,
  type LeaseFormValues,
} from '../../services/leases'
import type { IsoDate } from '../../types/common'
import type { Lease } from '../../types/lease'
import type { Property } from '../../types/property'
import type { Space } from '../../types/space'
import type { Tenant } from '../../types/tenant'
import { parseDisplayDate } from '../../utils/date'
import { formatDate } from '../../utils/format'
import { hasErrors } from '../../utils/validation'
import './LeaseForm.css'

type Field = keyof LeaseFormValues

const FIELD_ORDER: Field[] = ['tenantId', 'propertyId', 'spaceId', 'startDate', 'endDate', 'monthlyRent']

type SaveError = 'failed' | 'notFound'

interface LeaseFormProps {
  initialValues: LeaseFormValues
  /** Tenants and properties sorted for display. */
  tenants: Tenant[]
  properties: Property[]
  spaces: Space[]
  leases: Lease[]
  today: IsoDate
  /** The lease being edited: its tenant and space are shown but cannot change. */
  editing?: { id: string; tenant: Tenant | null; space: Space | null; property: Property | null }
  cancelTo: string
  onSubmit: (values: LeaseFormValues) => Promise<void>
}

export function LeaseForm({
  initialValues,
  tenants,
  properties,
  spaces,
  leases,
  today,
  editing,
  cancelTo,
  onSubmit,
}: LeaseFormProps) {
  const { t, locale } = useTranslation()
  const idPrefix = useId()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<LeaseFormErrors>({})
  const [showSummary, setShowSummary] = useState(false)
  const [saveError, setSaveError] = useState<SaveError | null>(null)
  const [saving, setSaving] = useState(false)

  const propertySpaces = useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true })
    return spaces
      .filter((space) => space.propertyId === values.propertyId)
      .toSorted((a, b) => collator.compare(a.name, b.name))
  }, [spaces, values.propertyId, locale])

  const startDate = parseDisplayDate(values.startDate)
  const endDate = values.endDate.trim() ? parseDisplayDate(values.endDate) : null
  const endValid = !values.endDate.trim() || endDate !== null
  // What the lease will mean for the space, shown while the dates are valid.
  const preview =
    startDate && endValid && (!endDate || endDate >= startDate)
      ? getLeaseStatus({ startDate, endDate }, today)
      : null

  const fieldId = (field: Field) => `${idPrefix}-${field}`

  const update = (field: Field, value: string) => {
    // A space belongs to one property, so choosing another property clears it.
    setValues((current) =>
      field === 'propertyId'
        ? { ...current, propertyId: value, spaceId: '' }
        : { ...current, [field]: value },
    )
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      // The dates decide whether the space overlaps another lease.
      if (field === 'propertyId' || field === 'startDate' || field === 'endDate') delete next.spaceId
      if (field === 'startDate') delete next.endDate
      return next
    })
    setSaveError(null)
  }

  const messages: Partial<Record<Field, string>> = {
    tenantId: errors.tenantId ? t(`leases.form.validation.tenantId.${errors.tenantId}`) : undefined,
    propertyId: errors.propertyId
      ? t(`leases.form.validation.propertyId.${errors.propertyId}`)
      : undefined,
    spaceId: errors.spaceId ? t(`leases.form.validation.spaceId.${errors.spaceId}`) : undefined,
    startDate: errors.startDate ? t(`leases.form.validation.startDate.${errors.startDate}`) : undefined,
    endDate: errors.endDate ? t(`leases.form.validation.endDate.${errors.endDate}`) : undefined,
    monthlyRent: errors.monthlyRent
      ? t(`leases.form.validation.monthlyRent.${errors.monthlyRent}`, { max: MONTHLY_RENT_MAX_EUROS })
      : undefined,
  }

  const showValidation = (validation: LeaseFormErrors) => {
    setErrors(validation)
    setShowSummary(true)
    const firstInvalid = FIELD_ORDER.find((field) => field in validation)
    if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateLeaseForm(values, {
      tenants,
      properties,
      spaces,
      leases,
      today,
      editingId: editing?.id,
    })
    setErrors(validation)
    if (hasErrors(validation)) {
      showValidation(validation)
      return
    }

    setShowSummary(false)
    setSaveError(null)
    setSaving(true)
    try {
      await onSubmit(values)
    } catch (error) {
      // The typed values stay in the form, so nothing is lost on failure.
      if (error instanceof LeaseValidationError) showValidation(error.errors)
      else setSaveError(error instanceof EntityNotFoundError ? 'notFound' : 'failed')
      setSaving(false)
    }
  }

  const select = (
    field: 'tenantId' | 'propertyId' | 'spaceId',
    placeholder: string,
    options: { value: string; label: string }[],
  ) => (
    <FormField
      id={fieldId(field)}
      label={t(`leases.form.fields.${field}`)}
      hint={field === 'spaceId' ? t('leases.form.hints.spaceId') : undefined}
      required
      error={messages[field]}
    >
      {(control) => (
        <select
          {...control}
          className="field__input"
          value={values[field]}
          disabled={field === 'spaceId' && !values.propertyId}
          onChange={(event) => update(field, event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  )

  return (
    <form className="card entity-form" onSubmit={handleSubmit} noValidate>
      <p className="field__hint">{t('leases.form.requiredHint')}</p>

      {showSummary && hasErrors(errors) && (
        <div className="alert alert--error" role="alert">
          {t('leases.form.errorSummary')}
        </div>
      )}
      {saveError && (
        <div className="alert alert--error" role="alert">
          {saveError === 'notFound' ? t('leases.form.notFoundError') : t('leases.form.saveError')}
        </div>
      )}

      {editing ? (
        <div className="lease-form__fixed">
          <dl className="detail-list">
            <dt>{t('leases.form.fields.tenantId')}</dt>
            <dd>
              {editing.tenant ? (
                <Link to={`/tenants/${editing.tenant.id}`}>{editing.tenant.name}</Link>
              ) : (
                t('leases.unknownTenant')
              )}
            </dd>
            <dt>{t('leases.form.fields.spaceId')}</dt>
            <dd>
              {editing.space ? (
                <Link to={`/units/${editing.space.id}/edit`}>{editing.space.name}</Link>
              ) : (
                t('leases.unknownSpace')
              )}
              {editing.property && `, ${editing.property.name}`}
            </dd>
          </dl>
          <p className="field__hint">{t('leases.form.fixedHint')}</p>
          {errors.spaceId && (
            <p className="field__error" role="alert">
              {messages.spaceId}
            </p>
          )}
        </div>
      ) : (
        <>
          {select(
            'tenantId',
            t('leases.form.selectTenant'),
            tenants.map((tenant) => ({ value: tenant.id, label: tenant.name })),
          )}
          <div className="entity-form__row">
            {select(
              'propertyId',
              t('leases.form.selectProperty'),
              properties.map((property) => ({ value: property.id, label: property.name })),
            )}
            {select(
              'spaceId',
              t('leases.form.selectSpace'),
              propertySpaces.map((space) => ({
                value: space.id,
                label: t('leases.form.spaceOption', {
                  space: space.name,
                  status: t(`space.status.${space.status}`),
                }),
              })),
            )}
          </div>
        </>
      )}

      <div className="entity-form__row">
        <FormField
          id={fieldId('startDate')}
          label={t('leases.form.fields.startDate')}
          hint={t('leases.form.hints.startDate')}
          required
          error={messages.startDate}
        >
          {(control) => (
            <DateInput
              control={control}
              text={values.startDate}
              onTextChange={(text) => update('startDate', text)}
              value={startDate}
              onSelect={(date) => update('startDate', formatDate(date))}
              field={t('leases.form.startDateField')}
              placeholder={t('maintenance.form.dueDatePlaceholder')}
            />
          )}
        </FormField>

        <FormField
          id={fieldId('endDate')}
          label={t('leases.form.fields.endDate')}
          hint={t('leases.form.hints.endDate')}
          error={messages.endDate}
        >
          {(control) => (
            <DateInput
              control={control}
              text={values.endDate}
              onTextChange={(text) => update('endDate', text)}
              value={endDate}
              onSelect={(date) => update('endDate', formatDate(date))}
              field={t('leases.form.endDateField')}
              placeholder={t('maintenance.form.dueDatePlaceholder')}
            />
          )}
        </FormField>
      </div>

      {/* The live region stays mounted so screen readers announce changes to it. */}
      <div aria-live="polite">
        {preview && startDate && (
          <p className="alert alert--info lease-form__preview">
            {preview === 'upcoming'
              ? t('leases.form.preview.upcoming', { date: formatDate(startDate) })
              : t(`leases.form.preview.${preview}`)}
          </p>
        )}
      </div>

      <FormField
        id={fieldId('monthlyRent')}
        label={t('leases.form.fields.monthlyRent')}
        hint={t('leases.form.hints.monthlyRent')}
        error={messages.monthlyRent}
      >
        {(control) => (
          <input
            {...control}
            className="field__input lease-form__rent"
            inputMode="decimal"
            autoComplete="off"
            value={values.monthlyRent}
            onChange={(event) => update('monthlyRent', event.target.value)}
          />
        )}
      </FormField>

      <div className="entity-form__actions">
        <Link to={cancelTo} className="button button--secondary">
          {t('leases.form.cancel')}
        </Link>
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? t('leases.form.saving') : t('leases.form.save')}
        </button>
      </div>
    </form>
  )
}
