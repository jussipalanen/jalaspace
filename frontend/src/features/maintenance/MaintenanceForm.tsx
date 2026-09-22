import { useId, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { DateInput } from '../../components/DateInput/DateInput'
import { FormField } from '../../components/FormField/FormField'
import { useTranslation } from '../../i18n/useTranslation'
import { EntityNotFoundError } from '../../repositories/Repository'
import {
  isMaintenanceCategory,
  isMaintenancePriority,
  isMaintenanceStatus,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_DESCRIPTION_MAX_LENGTH,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_TITLE_MAX_LENGTH,
  parseDueDate,
  validateMaintenanceForm,
  type MaintenanceFormErrors,
  type MaintenanceFormValues,
} from '../../services/maintenance'
import { MaintenanceValidationError } from '../../services/maintenanceService'
import type { Property } from '../../types/property'
import type { Space } from '../../types/space'
import type { MaintenanceSuggestion as Suggestion } from '../../services/maintenanceSuggestions'
import { formatDate } from '../../utils/format'
import { hasErrors } from '../../utils/validation'
import { MaintenanceSuggestion } from './MaintenanceSuggestion'

type Field = keyof MaintenanceFormValues

const FIELD_ORDER: Field[] = [
  'propertyId',
  'spaceId',
  'title',
  'description',
  'category',
  'priority',
  'status',
  'dueDate',
]

type SaveError = 'failed' | 'notFound'

interface MaintenanceFormProps {
  initialValues: MaintenanceFormValues
  /** Properties sorted for display. */
  properties: Property[]
  spaces: Space[]
  cancelTo: string
  onSubmit: (values: MaintenanceFormValues) => Promise<void>
}

export function MaintenanceForm({
  initialValues,
  properties,
  spaces,
  cancelTo,
  onSubmit,
}: MaintenanceFormProps) {
  const { t, locale } = useTranslation()
  const idPrefix = useId()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<MaintenanceFormErrors>({})
  const [showSummary, setShowSummary] = useState(false)
  const [saveError, setSaveError] = useState<SaveError | null>(null)
  const [saving, setSaving] = useState(false)

  const propertySpaces = useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true })
    return spaces
      .filter((space) => space.propertyId === values.propertyId)
      .toSorted((a, b) => collator.compare(a.name, b.name))
  }, [spaces, values.propertyId, locale])

  const fieldId = (field: Field) => `${idPrefix}-${field}`

  const update = <F extends Field>(field: F, value: MaintenanceFormValues[F]) => {
    // A space belongs to one property, so choosing another property clears it.
    setValues((current) =>
      field === 'propertyId'
        ? { ...current, propertyId: value as string, spaceId: '' }
        : { ...current, [field]: value },
    )
    const cleared: Field[] = field === 'propertyId' ? ['propertyId', 'spaceId'] : [field]
    setErrors((current) => {
      const next = { ...current }
      for (const key of cleared) delete next[key]
      return next
    })
    setSaveError(null)
  }

  // Fills in the reviewed suggestion; the user can still change every field before saving.
  const applySuggestion = ({ title, description, category, priority }: Suggestion) => {
    setValues((current) => ({ ...current, title, description, category, priority }))
    setErrors((current) => {
      const {
        title: _title,
        description: _description,
        category: _category,
        priority: _priority,
        ...rest
      } = current
      return rest
    })
    setSaveError(null)
    document.getElementById(fieldId('title'))?.focus()
  }

  const messages: Partial<Record<Field, string>> = {
    propertyId: errors.propertyId
      ? t(`maintenance.form.validation.propertyId.${errors.propertyId}`)
      : undefined,
    spaceId: errors.spaceId ? t(`maintenance.form.validation.spaceId.${errors.spaceId}`) : undefined,
    title: errors.title
      ? t(`maintenance.form.validation.title.${errors.title}`, { max: MAINTENANCE_TITLE_MAX_LENGTH })
      : undefined,
    description: errors.description
      ? t(`maintenance.form.validation.description.${errors.description}`, {
          max: MAINTENANCE_DESCRIPTION_MAX_LENGTH,
        })
      : undefined,
    category: errors.category
      ? t(`maintenance.form.validation.category.${errors.category}`)
      : undefined,
    priority: errors.priority
      ? t(`maintenance.form.validation.priority.${errors.priority}`)
      : undefined,
    status: errors.status ? t(`maintenance.form.validation.status.${errors.status}`) : undefined,
    dueDate: errors.dueDate ? t(`maintenance.form.validation.dueDate.${errors.dueDate}`) : undefined,
  }

  const showValidation = (validation: MaintenanceFormErrors) => {
    setErrors(validation)
    setShowSummary(true)
    const firstInvalid = FIELD_ORDER.find((field) => field in validation)
    if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateMaintenanceForm(values, properties, spaces)
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
      if (error instanceof MaintenanceValidationError) showValidation(error.errors)
      else setSaveError(error instanceof EntityNotFoundError ? 'notFound' : 'failed')
      setSaving(false)
    }
  }

  return (
    <form className="card entity-form" onSubmit={handleSubmit} noValidate>
      <p className="field__hint">{t('maintenance.form.requiredHint')}</p>

      {showSummary && hasErrors(errors) && (
        <div className="alert alert--error" role="alert">
          {t('maintenance.form.errorSummary')}
        </div>
      )}
      {saveError && (
        <div className="alert alert--error" role="alert">
          {saveError === 'notFound'
            ? t('maintenance.form.notFoundError')
            : t('maintenance.form.saveError')}
        </div>
      )}

      <div className="entity-form__row">
        <FormField
          id={fieldId('propertyId')}
          label={t('maintenance.form.fields.propertyId')}
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
              <option value="">{t('maintenance.form.selectProperty')}</option>
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
          label={t('maintenance.form.fields.spaceId')}
          hint={t('maintenance.form.hints.spaceId')}
          error={messages.spaceId}
        >
          {(control) => (
            <select
              {...control}
              className="field__input"
              value={values.spaceId}
              onChange={(event) => update('spaceId', event.target.value)}
            >
              <option value="">{t('maintenance.form.wholeProperty')}</option>
              {propertySpaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <FormField
        id={fieldId('title')}
        label={t('maintenance.form.fields.title')}
        hint={t('maintenance.form.hints.title', { max: MAINTENANCE_TITLE_MAX_LENGTH })}
        required
        error={messages.title}
      >
        {(control) => (
          <input
            {...control}
            className="field__input"
            value={values.title}
            onChange={(event) => update('title', event.target.value)}
          />
        )}
      </FormField>

      <FormField
        id={fieldId('description')}
        label={t('maintenance.form.fields.description')}
        hint={t('maintenance.form.hints.description', { max: MAINTENANCE_DESCRIPTION_MAX_LENGTH })}
        error={messages.description}
      >
        {(control) => (
          <textarea
            {...control}
            className="field__input"
            rows={4}
            value={values.description}
            onChange={(event) => update('description', event.target.value)}
          />
        )}
      </FormField>

      <MaintenanceSuggestion
        title={values.title}
        description={values.description}
        onApply={applySuggestion}
      />

      <div className="entity-form__row">
        <FormField
          id={fieldId('category')}
          label={t('maintenance.form.fields.category')}
          required
          error={messages.category}
        >
          {(control) => (
            <select
              {...control}
              className="field__input"
              value={values.category}
              onChange={(event) => {
                if (isMaintenanceCategory(event.target.value)) update('category', event.target.value)
              }}
            >
              {MAINTENANCE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(`maintenance.category.${category}`)}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField
          id={fieldId('priority')}
          label={t('maintenance.form.fields.priority')}
          required
          error={messages.priority}
        >
          {(control) => (
            <select
              {...control}
              className="field__input"
              value={values.priority}
              onChange={(event) => {
                if (isMaintenancePriority(event.target.value)) update('priority', event.target.value)
              }}
            >
              {MAINTENANCE_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`maintenance.priority.${priority}`)}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <div className="entity-form__row">
        <FormField
          id={fieldId('status')}
          label={t('maintenance.form.fields.status')}
          hint={t('maintenance.form.hints.status')}
          required
          error={messages.status}
        >
          {(control) => (
            <select
              {...control}
              className="field__input"
              value={values.status}
              onChange={(event) => {
                if (isMaintenanceStatus(event.target.value)) update('status', event.target.value)
              }}
            >
              {MAINTENANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`maintenance.status.${status}`)}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField
          id={fieldId('dueDate')}
          label={t('maintenance.form.fields.dueDate')}
          hint={t('maintenance.form.hints.dueDate')}
          error={messages.dueDate}
        >
          {(control) => (
            <DateInput
              control={control}
              text={values.dueDate}
              onTextChange={(text) => update('dueDate', text)}
              value={parseDueDate(values.dueDate)}
              onSelect={(date) => update('dueDate', formatDate(date))}
              field={t('maintenance.form.fields.dueDate').toLocaleLowerCase(locale)}
              placeholder={t('maintenance.form.dueDatePlaceholder')}
            />
          )}
        </FormField>
      </div>

      <div className="entity-form__actions">
        <Link to={cancelTo} className="button button--secondary">
          {t('maintenance.form.cancel')}
        </Link>
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? t('maintenance.form.saving') : t('maintenance.form.save')}
        </button>
      </div>
    </form>
  )
}
