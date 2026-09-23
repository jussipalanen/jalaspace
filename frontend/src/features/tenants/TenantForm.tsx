import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { FormField } from '../../components/FormField/FormField'
import { useTranslation } from '../../i18n/useTranslation'
import { EntityNotFoundError } from '../../repositories/Repository'
import { TenantValidationError } from '../../services/tenantService'
import {
  TENANT_CONTACT_MAX_LENGTH,
  TENANT_EMAIL_MAX_LENGTH,
  TENANT_NAME_MAX_LENGTH,
  TENANT_NOTES_MAX_LENGTH,
  TENANT_TYPES,
  validateTenantForm,
  type TenantFormErrors,
  type TenantFormValues,
} from '../../services/tenants'
import type { Tenant } from '../../types/tenant'
import { hasErrors } from '../../utils/validation'
import { apiLimitCode, type ApiLimitCode } from '../../utils/apiLimits'

type Field = keyof TenantFormValues

const FIELD_ORDER: Field[] = ['type', 'name', 'contactPerson', 'email', 'phone', 'notes']

type SaveError = 'failed' | 'notFound' | ApiLimitCode

interface TenantFormProps {
  initialValues: TenantFormValues
  /** All tenants, used to keep emails unique. */
  tenants: Tenant[]
  editingId?: string
  cancelTo: string
  onSubmit: (values: TenantFormValues) => Promise<void>
}

export function TenantForm({ initialValues, tenants, editingId, cancelTo, onSubmit }: TenantFormProps) {
  const { t } = useTranslation()
  const idPrefix = useId()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<TenantFormErrors>({})
  const [showSummary, setShowSummary] = useState(false)
  const [saveError, setSaveError] = useState<SaveError | null>(null)
  const [saving, setSaving] = useState(false)

  const fieldId = (field: Field) => `${idPrefix}-${field}`

  const update = <F extends Field>(field: F, value: TenantFormValues[F]) => {
    // A person has no separate contact person, so switching to person clears it.
    setValues((current) =>
      field === 'type' && value === 'person'
        ? { ...current, type: 'person', contactPerson: '' }
        : { ...current, [field]: value },
    )
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      if (field === 'type') delete next.contactPerson
      return next
    })
    setSaveError(null)
  }

  const messages: Partial<Record<Field, string>> = {
    type: errors.type ? t(`tenants.form.validation.type.${errors.type}`) : undefined,
    name: errors.name
      ? t(`tenants.form.validation.name.${errors.name}`, { max: TENANT_NAME_MAX_LENGTH })
      : undefined,
    contactPerson: errors.contactPerson
      ? t(`tenants.form.validation.contactPerson.${errors.contactPerson}`, {
          max: TENANT_CONTACT_MAX_LENGTH,
        })
      : undefined,
    email: errors.email
      ? t(`tenants.form.validation.email.${errors.email}`, { max: TENANT_EMAIL_MAX_LENGTH })
      : undefined,
    phone: errors.phone ? t(`tenants.form.validation.phone.${errors.phone}`) : undefined,
    notes: errors.notes
      ? t(`tenants.form.validation.notes.${errors.notes}`, { max: TENANT_NOTES_MAX_LENGTH })
      : undefined,
  }
  const message = (field: Field) => messages[field]

  const showValidation = (validation: TenantFormErrors) => {
    setErrors(validation)
    setShowSummary(true)
    const firstInvalid = FIELD_ORDER.find((field) => field in validation)
    if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateTenantForm(values, tenants, editingId)
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
      if (error instanceof TenantValidationError) showValidation(error.errors)
      else setSaveError(apiLimitCode(error) ?? (error instanceof EntityNotFoundError ? 'notFound' : 'failed'))
      setSaving(false)
    }
  }

  const textField = (field: 'contactPerson' | 'email' | 'phone', options: {
    required?: boolean
    hint?: string
    type?: string
  } = {}) => (
    <FormField
      id={fieldId(field)}
      label={t(`tenants.form.fields.${field}`)}
      hint={options.hint}
      required={options.required}
      error={message(field)}
    >
      {(control) => (
        <input
          {...control}
          className="field__input"
          type={options.type ?? 'text'}
          autoComplete="off"
          value={values[field]}
          onChange={(event) => update(field, event.target.value)}
        />
      )}
    </FormField>
  )

  return (
    <form className="card entity-form" onSubmit={handleSubmit} noValidate>
      <p className="field__hint">{t('tenants.form.requiredHint')}</p>

      {showSummary && hasErrors(errors) && (
        <div className="alert alert--error" role="alert">
          {t('tenants.form.errorSummary')}
        </div>
      )}
      {saveError && (
        <div className="alert alert--error" role="alert">
          {saveError === 'notFound'
            ? t('tenants.form.notFoundError')
            : saveError === 'failed'
              ? t('tenants.form.saveError')
              : t(`states.apiLimit.${saveError}`)}
        </div>
      )}

      <fieldset className="choice-group" aria-describedby={errors.type ? fieldId('type') + '-error' : undefined}>
        <legend className="field__label">
          {t('tenants.form.fields.type')}
          <span className="field__required" aria-hidden="true">
            *
          </span>
        </legend>
        <div className="choice-group__options">
          {TENANT_TYPES.map((type, index) => (
            <label key={type} className="choice-group__option">
              <input
                type="radio"
                name={fieldId('type')}
                id={index === 0 ? fieldId('type') : undefined}
                value={type}
                checked={values.type === type}
                onChange={() => update('type', type)}
              />
              {t(`tenant.type.${type}`)}
            </label>
          ))}
        </div>
        {errors.type && (
          <p id={`${fieldId('type')}-error`} className="field__error">
            {message('type')}
          </p>
        )}
      </fieldset>

      <div className={values.type === 'company' ? 'entity-form__row' : undefined}>
        <FormField
          id={fieldId('name')}
          label={
            values.type === 'company'
              ? t('tenants.form.fields.nameCompany')
              : t('tenants.form.fields.namePerson')
          }
          hint={t('tenants.form.hints.name', { max: TENANT_NAME_MAX_LENGTH })}
          required
          error={message('name')}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              autoComplete="off"
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
            />
          )}
        </FormField>
        {values.type === 'company' && textField('contactPerson')}
      </div>

      <div className="entity-form__row">
        {textField('email', { required: true, type: 'email' })}
        {textField('phone', { type: 'tel', hint: t('tenants.form.hints.phone') })}
      </div>

      <FormField
        id={fieldId('notes')}
        label={t('tenants.form.fields.notes')}
        hint={t('tenants.form.hints.notes', { max: TENANT_NOTES_MAX_LENGTH })}
        error={message('notes')}
      >
        {(control) => (
          <textarea
            {...control}
            className="field__input"
            rows={4}
            value={values.notes}
            onChange={(event) => update('notes', event.target.value)}
          />
        )}
      </FormField>

      <div className="entity-form__actions">
        <Link to={cancelTo} className="button button--secondary">
          {t('tenants.form.cancel')}
        </Link>
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? t('tenants.form.saving') : t('tenants.form.save')}
        </button>
      </div>
    </form>
  )
}
