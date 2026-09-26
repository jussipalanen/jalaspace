import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { FormField } from '../../components/FormField/FormField'
import { useTranslation } from '../../i18n/useTranslation'
import {
  isPropertyType,
  PROPERTY_DESCRIPTION_MAX_LENGTH,
  PROPERTY_NAME_MAX_LENGTH,
  PROPERTY_TYPES,
  validatePropertyForm,
  type PropertyFormErrors,
  type PropertyFormValues,
} from '../../services/properties'
import { hasErrors } from '../../utils/validation'
import { apiLimitCode, type ApiLimitCode } from '../../utils/apiLimits'
import { PropertyLocationFields } from './PropertyLocationFields'

type Field = keyof PropertyFormValues

/** Order of the fields in the form, used to focus the first invalid one. */
const FIELD_ORDER: Field[] = [
  'name',
  'type',
  'address',
  'postalCode',
  'city',
  'description',
  'latitude',
  'longitude',
]

interface PropertyFormProps {
  initialValues: PropertyFormValues
  cancelTo: string
  /** Saves the values; rejecting shows a save error. */
  onSubmit: (values: PropertyFormValues) => Promise<void>
}

export function PropertyForm({ initialValues, cancelTo, onSubmit }: PropertyFormProps) {
  const { t } = useTranslation()
  const idPrefix = useId()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<PropertyFormErrors>({})
  const [showSummary, setShowSummary] = useState(false)
  const [saveError, setSaveError] = useState<'failed' | ApiLimitCode | null>(null)
  const [saving, setSaving] = useState(false)

  const fieldId = (field: Field) => `${idPrefix}-${field}`

  const update = <F extends Field>(field: F, value: PropertyFormValues[F]) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSaveError(null)
  }

  const messages: Partial<Record<Field, string>> = {
    name: errors.name
      ? t(`properties.form.validation.name.${errors.name}`, { max: PROPERTY_NAME_MAX_LENGTH })
      : undefined,
    address: errors.address ? t('properties.form.validation.address.required') : undefined,
    postalCode: errors.postalCode
      ? t(`properties.form.validation.postalCode.${errors.postalCode}`)
      : undefined,
    city: errors.city ? t('properties.form.validation.city.required') : undefined,
    description: errors.description
      ? t('properties.form.validation.description.tooLong', {
          max: PROPERTY_DESCRIPTION_MAX_LENGTH,
        })
      : undefined,
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validatePropertyForm(values)
    setErrors(validation)

    if (hasErrors(validation)) {
      setShowSummary(true)
      // Move focus to the first invalid field so keyboard and screen reader users find it.
      const firstInvalid = FIELD_ORDER.find((field) => field in validation)
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }

    setShowSummary(false)
    setSaveError(null)
    setSaving(true)
    try {
      await onSubmit(values)
    } catch (error) {
      setSaveError(apiLimitCode(error) ?? 'failed')
      setSaving(false)
    }
  }

  return (
    <form className="card entity-form" onSubmit={handleSubmit} noValidate>
      <p className="field__hint">{t('properties.form.requiredHint')}</p>

      {showSummary && hasErrors(errors) && (
        <div className="alert alert--error" role="alert">
          {t('properties.form.errorSummary')}
        </div>
      )}
      {saveError && (
        <div className="alert alert--error" role="alert">
          {saveError === 'failed'
            ? t('properties.form.saveError')
            : t(`states.apiLimit.${saveError}`)}
        </div>
      )}

      <FormField
        id={fieldId('name')}
        label={t('properties.form.fields.name')}
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

      <FormField id={fieldId('type')} label={t('properties.form.fields.type')} required>
        {(control) => (
          <select
            {...control}
            className="field__input"
            value={values.type}
            onChange={(event) => {
              if (isPropertyType(event.target.value)) update('type', event.target.value)
            }}
          >
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`properties.type.${type}`)}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField
        id={fieldId('address')}
        label={t('properties.form.fields.address')}
        required
        error={messages.address}
      >
        {(control) => (
          <input
            {...control}
            className="field__input"
            autoComplete="street-address"
            value={values.address}
            onChange={(event) => update('address', event.target.value)}
          />
        )}
      </FormField>

      <div className="entity-form__row entity-form__row--narrow-first">
        <FormField
          id={fieldId('postalCode')}
          label={t('properties.form.fields.postalCode')}
          hint={t('properties.form.hints.postalCode')}
          required
          error={messages.postalCode}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              inputMode="numeric"
              autoComplete="postal-code"
              value={values.postalCode}
              onChange={(event) => update('postalCode', event.target.value)}
            />
          )}
        </FormField>

        <FormField
          id={fieldId('city')}
          label={t('properties.form.fields.city')}
          required
          error={messages.city}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              autoComplete="address-level2"
              value={values.city}
              onChange={(event) => update('city', event.target.value)}
            />
          )}
        </FormField>
      </div>

      <FormField
        id={fieldId('description')}
        label={t('properties.form.fields.description')}
        hint={t('properties.form.hints.description', { max: PROPERTY_DESCRIPTION_MAX_LENGTH })}
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

      <PropertyLocationFields
        values={values}
        errors={{ latitude: errors.latitude, longitude: errors.longitude }}
        latitudeId={fieldId('latitude')}
        longitudeId={fieldId('longitude')}
        onChange={(latitude, longitude) => {
          setValues((current) => ({ ...current, latitude, longitude }))
          setErrors((current) => ({ ...current, latitude: undefined, longitude: undefined }))
          setSaveError(null)
        }}
        onZoomChange={(zoom) => setValues((current) => ({ ...current, zoom }))}
      />

      <div className="entity-form__actions">
        <Link to={cancelTo} className="button button--secondary">
          {t('properties.form.cancel')}
        </Link>
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? t('properties.form.saving') : t('properties.form.save')}
        </button>
      </div>
    </form>
  )
}
