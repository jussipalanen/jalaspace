import { useId, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { DateInput } from '../../components/DateInput/DateInput'
import { FormField } from '../../components/FormField/FormField'
import { useTranslation } from '../../i18n/useTranslation'
import { AssignmentValidationError } from '../../services/tenantService'
import {
  canAssignSpace,
  MONTHLY_RENT_MAX_EUROS,
  validateAssignmentForm,
  type AssignmentFormErrors,
  type AssignmentFormValues,
} from '../../services/tenants'
import type { IsoDate } from '../../types/common'
import type { Lease } from '../../types/lease'
import type { Property } from '../../types/property'
import type { Space } from '../../types/space'
import { parseDisplayDate } from '../../utils/date'
import { formatDate } from '../../utils/format'
import { hasErrors } from '../../utils/validation'

type Field = keyof AssignmentFormValues

const FIELD_ORDER: Field[] = ['propertyId', 'spaceId', 'startDate', 'monthlyRent']

interface AssignSpaceFormProps {
  initialValues: AssignmentFormValues
  /** Properties sorted for display. */
  properties: Property[]
  spaces: Space[]
  leases: Lease[]
  today: IsoDate
  cancelTo: string
  onSubmit: (values: AssignmentFormValues) => Promise<void>
}

export function AssignSpaceForm({
  initialValues,
  properties,
  spaces,
  leases,
  today,
  cancelTo,
  onSubmit,
}: AssignSpaceFormProps) {
  const { t, locale } = useTranslation()
  const idPrefix = useId()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<AssignmentFormErrors>({})
  const [showSummary, setShowSummary] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [saving, setSaving] = useState(false)

  const startDate = parseDisplayDate(values.startDate)
  // Spaces that can take a new lease from the chosen start date (today while the date is incomplete).
  const availableSpaces = useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true })
    return spaces
      .filter(
        (space) =>
          space.propertyId === values.propertyId &&
          (space.id === values.spaceId || canAssignSpace(space, leases, startDate ?? today) === 'ok'),
      )
      .toSorted((a, b) => collator.compare(a.name, b.name))
  }, [spaces, leases, values.propertyId, values.spaceId, startDate, today, locale])

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
      // The start date decides whether the space overlaps another lease.
      if (field === 'propertyId' || field === 'startDate') delete next.spaceId
      return next
    })
    setSaveError(false)
  }

  const messages: Partial<Record<Field, string>> = {
    propertyId: errors.propertyId
      ? t(`tenants.assign.validation.propertyId.${errors.propertyId}`)
      : undefined,
    spaceId: errors.spaceId ? t(`tenants.assign.validation.spaceId.${errors.spaceId}`) : undefined,
    startDate: errors.startDate
      ? t(`tenants.assign.validation.startDate.${errors.startDate}`)
      : undefined,
    monthlyRent: errors.monthlyRent
      ? t(`tenants.assign.validation.monthlyRent.${errors.monthlyRent}`, {
          max: MONTHLY_RENT_MAX_EUROS,
        })
      : undefined,
  }

  const showValidation = (validation: AssignmentFormErrors) => {
    setErrors(validation)
    setShowSummary(true)
    const firstInvalid = FIELD_ORDER.find((field) => field in validation)
    if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateAssignmentForm(values, properties, spaces, leases)
    setErrors(validation)
    if (hasErrors(validation)) {
      showValidation(validation)
      return
    }

    setShowSummary(false)
    setSaveError(false)
    setSaving(true)
    try {
      await onSubmit(values)
    } catch (error) {
      // The typed values stay in the form, so nothing is lost on failure.
      if (error instanceof AssignmentValidationError) showValidation(error.errors)
      else setSaveError(true)
      setSaving(false)
    }
  }

  return (
    <form className="card entity-form" onSubmit={handleSubmit} noValidate>
      <p className="field__hint">{t('tenants.form.requiredHint')}</p>

      {showSummary && hasErrors(errors) && (
        <div className="alert alert--error" role="alert">
          {t('tenants.assign.errorSummary')}
        </div>
      )}
      {saveError && (
        <div className="alert alert--error" role="alert">
          {t('tenants.assign.saveError')}
        </div>
      )}

      <div className="entity-form__row">
        <FormField
          id={fieldId('propertyId')}
          label={t('tenants.assign.fields.propertyId')}
          required
          error={messages.propertyId}
        >
          {(control) => (
            <select
              {...control}
              className="field__input"
              value={values.propertyId}
              onChange={(event) => update('propertyId', event.target.value)}
            >
              <option value="">{t('tenants.assign.selectProperty')}</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField
          id={fieldId('spaceId')}
          label={t('tenants.assign.fields.spaceId')}
          hint={
            values.propertyId && availableSpaces.length === 0
              ? t('tenants.assign.noSpaces')
              : t('tenants.assign.hints.spaceId')
          }
          required
          error={messages.spaceId}
        >
          {(control) => (
            <select
              {...control}
              className="field__input"
              value={values.spaceId}
              disabled={!values.propertyId}
              onChange={(event) => update('spaceId', event.target.value)}
            >
              <option value="">{t('tenants.assign.selectSpace')}</option>
              {availableSpaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <div className="entity-form__row">
        <FormField
          id={fieldId('startDate')}
          label={t('tenants.assign.fields.startDate')}
          hint={t('tenants.assign.hints.startDate')}
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
              field={t('tenants.assign.startDateField')}
              placeholder={t('maintenance.form.dueDatePlaceholder')}
            />
          )}
        </FormField>
        <FormField
          id={fieldId('monthlyRent')}
          label={t('tenants.assign.fields.monthlyRent')}
          hint={t('tenants.assign.hints.monthlyRent')}
          error={messages.monthlyRent}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              inputMode="decimal"
              autoComplete="off"
              value={values.monthlyRent}
              onChange={(event) => update('monthlyRent', event.target.value)}
            />
          )}
        </FormField>
      </div>

      <div className="entity-form__actions">
        <Link to={cancelTo} className="button button--secondary">
          {t('tenants.assign.cancel')}
        </Link>
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? t('tenants.assign.saving') : t('tenants.assign.save')}
        </button>
      </div>
    </form>
  )
}
