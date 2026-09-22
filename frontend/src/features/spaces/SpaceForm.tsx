import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { FormField } from '../../components/FormField/FormField'
import { useTranslation } from '../../i18n/useTranslation'
import { SpaceValidationError } from '../../services/spaceService'
import {
  isSpaceStatus,
  isSpaceType,
  MANUAL_SPACE_STATUSES,
  SPACE_AREA_MAX,
  SPACE_FLOOR_MAX,
  SPACE_FLOOR_MIN,
  SPACE_NAME_MAX_LENGTH,
  SPACE_TYPES,
  validateSpaceForm,
  type SpaceFormErrors,
  type SpaceFormValues,
} from '../../services/spaces'
import type { Property } from '../../types/property'
import type { IsoDate } from '../../types/common'
import type { Space } from '../../types/space'
import type { Tenant } from '../../types/tenant'
import { formatDate } from '../../utils/format'
import { hasErrors } from '../../utils/validation'

type Field = keyof SpaceFormValues

const FIELD_ORDER: Field[] = ['propertyId', 'name', 'type', 'floor', 'area', 'status']

interface SpaceFormProps {
  initialValues: SpaceFormValues
  properties: Property[]
  /** All spaces, used to keep names unique within a property. */
  spaces: Space[]
  editingId?: string
  /** Set when the space has an active lease: the status is then fixed to occupied. */
  lockedStatus?: { tenant: Pick<Tenant, 'id' | 'name'> | null; since: IsoDate }
  cancelTo: string
  onSubmit: (values: SpaceFormValues) => Promise<void>
}

export function SpaceForm({
  initialValues,
  properties,
  spaces,
  editingId,
  lockedStatus,
  cancelTo,
  onSubmit,
}: SpaceFormProps) {
  const { t } = useTranslation()
  const idPrefix = useId()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<SpaceFormErrors>({})
  const [showSummary, setShowSummary] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [saving, setSaving] = useState(false)

  const fieldId = (field: Field) => `${idPrefix}-${field}`

  const update = <F extends Field>(field: F, value: SpaceFormValues[F]) => {
    setValues((current) => ({ ...current, [field]: value }))
    // Changing the property can resolve or cause a duplicate name.
    const cleared = field === 'propertyId' ? ['propertyId', 'name'] : [field]
    setErrors((current) => {
      const next = { ...current }
      for (const key of cleared) delete next[key as keyof SpaceFormErrors]
      return next
    })
    setSaveError(false)
  }

  const messages: Partial<Record<Field, string>> = {
    propertyId: errors.propertyId ? t(`spaces.form.validation.propertyId.${errors.propertyId}`) : undefined,
    name: errors.name
      ? t(`spaces.form.validation.name.${errors.name}`, { max: SPACE_NAME_MAX_LENGTH })
      : undefined,
    floor: errors.floor
      ? t(`spaces.form.validation.floor.${errors.floor}`, {
          min: SPACE_FLOOR_MIN,
          max: SPACE_FLOOR_MAX,
        })
      : undefined,
    area: errors.area
      ? t(`spaces.form.validation.area.${errors.area}`, { max: SPACE_AREA_MAX })
      : undefined,
  }

  const showValidation = (validation: SpaceFormErrors) => {
    setErrors(validation)
    setShowSummary(true)
    const firstInvalid = FIELD_ORDER.find((field) => field in validation)
    if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateSpaceForm(values, spaces, editingId)
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
      if (error instanceof SpaceValidationError) showValidation(error.errors)
      else setSaveError(true)
      setSaving(false)
    }
  }

  return (
    <form className="card entity-form" onSubmit={handleSubmit} noValidate>
      <p className="field__hint">{t('spaces.form.requiredHint')}</p>

      {showSummary && hasErrors(errors) && (
        <div className="alert alert--error" role="alert">
          {t('spaces.form.errorSummary')}
        </div>
      )}
      {saveError && (
        <div className="alert alert--error" role="alert">
          {t('spaces.form.saveError')}
        </div>
      )}

      <FormField
        id={fieldId('propertyId')}
        label={t('spaces.form.fields.propertyId')}
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
            <option value="">{t('spaces.form.selectProperty')}</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <div className="entity-form__row">
        <FormField
          id={fieldId('name')}
          label={t('spaces.form.fields.name')}
          hint={t('spaces.form.hints.name')}
          required
          error={messages.name}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
            />
          )}
        </FormField>

        <FormField id={fieldId('type')} label={t('spaces.form.fields.type')} required>
          {(control) => (
            <select
              {...control}
              className="field__input"
              value={values.type}
              onChange={(event) => {
                if (isSpaceType(event.target.value)) update('type', event.target.value)
              }}
            >
              {SPACE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`space.type.${type}`)}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <div className="entity-form__row">
        <FormField
          id={fieldId('floor')}
          label={t('spaces.form.fields.floor')}
          hint={t('spaces.form.hints.floor')}
          required
          error={messages.floor}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              value={values.floor}
              onChange={(event) => update('floor', event.target.value)}
            />
          )}
        </FormField>

        <FormField
          id={fieldId('area')}
          label={t('spaces.form.fields.area')}
          hint={t('spaces.form.hints.area')}
          required
          error={messages.area}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              inputMode="decimal"
              value={values.area}
              onChange={(event) => update('area', event.target.value)}
            />
          )}
        </FormField>
      </div>

      {lockedStatus ? (
        <div className="field">
          <span className="field__label">{t('spaces.form.fields.status')}</span>
          <div className="alert alert--info entity-form__locked">
            <p>{t('spaces.form.occupiedLocked', { date: formatDate(lockedStatus.since) })}</p>
            {lockedStatus.tenant && (
              <p>
                {t('spaces.form.tenant')}:{' '}
                <Link to={`/tenants/${lockedStatus.tenant.id}`}>{lockedStatus.tenant.name}</Link>
                {' · '}
                <Link
                  to={`/tenants/${lockedStatus.tenant.id}/edit`}
                  aria-label={t('spaces.form.editTenantNamed', { name: lockedStatus.tenant.name })}
                >
                  {t('spaces.form.editTenant')}
                </Link>
              </p>
            )}
          </div>
        </div>
      ) : (
        <FormField
          id={fieldId('status')}
          label={t('spaces.form.fields.status')}
          hint={t('spaces.form.hints.status')}
          required
        >
          {(control) => (
            <select
              {...control}
              className="field__input"
              value={values.status}
              onChange={(event) => {
                if (isSpaceStatus(event.target.value)) update('status', event.target.value)
              }}
            >
              {MANUAL_SPACE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`space.status.${status}`)}
                </option>
              ))}
            </select>
          )}
        </FormField>
      )}

      <div className="entity-form__actions">
        <Link to={cancelTo} className="button button--secondary">
          {t('spaces.form.cancel')}
        </Link>
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? t('spaces.form.saving') : t('spaces.form.save')}
        </button>
      </div>
    </form>
  )
}
