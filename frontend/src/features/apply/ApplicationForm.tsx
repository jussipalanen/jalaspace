import { useId, useState, type FormEvent } from 'react'
import { DateInput } from '../../components/DateInput/DateInput'
import { FormField } from '../../components/FormField/FormField'
import { InfoIcon } from '../../components/icons'
import { isSharedData } from '../../config/dataProvider'
import { useTranslation } from '../../i18n/useTranslation'
import {
  APPLICATION_MESSAGE_MAX_LENGTH,
  emptyApplicationForm,
  validateApplicationForm,
  type ApplicationFormErrors,
  type ApplicationFormValues,
} from '../../services/applications'
import { ApplicationValidationError } from '../../services/applicationService'
import { TENANT_CONTACT_MAX_LENGTH, TENANT_EMAIL_MAX_LENGTH, TENANT_NAME_MAX_LENGTH, TENANT_TYPES } from '../../services/tenants'
import { apiLimitCode, type ApiLimitCode } from '../../utils/apiLimits'
import { addDays, parseDisplayDate } from '../../utils/date'
import { formatDate } from '../../utils/format'
import { hasErrors } from '../../utils/validation'
import './ApplicationForm.css'

type Field = keyof ApplicationFormValues | 'consent'

const FIELD_ORDER: Field[] = [
  'applicantType',
  'name',
  'contactPerson',
  'email',
  'phone',
  'desiredStartDate',
  'message',
  'consent',
]

type Errors = ApplicationFormErrors & { consent?: 'required' }

interface ApplicationFormProps {
  /** Sends the application; rejects with `ApplicationValidationError` for invalid fields. */
  onSubmit: (values: ApplicationFormValues) => Promise<void>
}

/** The public application form, in short sections, with the demo notice and consent. */
export function ApplicationForm({ onSubmit }: ApplicationFormProps) {
  const { t, locale } = useTranslation()
  const idPrefix = useId()
  const [values, setValues] = useState(emptyApplicationForm)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [showSummary, setShowSummary] = useState(false)
  const [sendError, setSendError] = useState<'failed' | ApiLimitCode | null>(null)
  const [sending, setSending] = useState(false)
  // An example a month from now, so it is always a valid answer.
  const example = formatDate(addDays(new Date(), 30).toISOString())

  const fieldId = (field: Field) => `${idPrefix}-${field}`

  const update = <F extends keyof ApplicationFormValues>(field: F, value: ApplicationFormValues[F]) => {
    // A person has no separate contact person, so switching to person clears it.
    setValues((current) =>
      field === 'applicantType' && value === 'person'
        ? { ...current, applicantType: 'person', contactPerson: '' }
        : { ...current, [field]: value },
    )
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
    setSendError(null)
  }

  const messages: Record<Field, string | undefined> = {
    applicantType: errors.applicantType && t(`apply.form.validation.applicantType.${errors.applicantType}`),
    name: errors.name && t(`apply.form.validation.name.${errors.name}`, { max: TENANT_NAME_MAX_LENGTH }),
    contactPerson:
      errors.contactPerson &&
      t(`apply.form.validation.contactPerson.${errors.contactPerson}`, { max: TENANT_CONTACT_MAX_LENGTH }),
    email: errors.email && t(`apply.form.validation.email.${errors.email}`, { max: TENANT_EMAIL_MAX_LENGTH }),
    phone: errors.phone && t(`apply.form.validation.phone.${errors.phone}`),
    desiredStartDate:
      errors.desiredStartDate && t(`apply.form.validation.desiredStartDate.${errors.desiredStartDate}`, { example }),
    message:
      errors.message && t(`apply.form.validation.message.${errors.message}`, { max: APPLICATION_MESSAGE_MAX_LENGTH }),
    consent: errors.consent && t('apply.form.validation.consent.required'),
  }

  const showValidation = (validation: Errors) => {
    setErrors(validation)
    setShowSummary(true)
    const firstInvalid = FIELD_ORDER.find((field) => field in validation)
    if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation: Errors = validateApplicationForm(values)
    if (!consent) validation.consent = 'required'
    if (hasErrors(validation)) {
      showValidation(validation)
      return
    }

    setShowSummary(false)
    setSendError(null)
    setSending(true)
    try {
      await onSubmit(values)
    } catch (error) {
      // The typed values stay in the form, so nothing is lost on failure.
      if (error instanceof ApplicationValidationError) showValidation(error.errors)
      else setSendError(apiLimitCode(error) ?? 'failed')
      setSending(false)
    }
  }

  const textField = (
    field: 'name' | 'contactPerson' | 'email' | 'phone',
    label: string,
    options: { required?: boolean; hint?: string; type?: string; autoComplete?: string } = {},
  ) => (
    <FormField id={fieldId(field)} label={label} hint={options.hint} required={options.required} error={messages[field]}>
      {(control) => (
        <input
          {...control}
          className="field__input"
          type={options.type ?? 'text'}
          autoComplete={options.autoComplete ?? 'off'}
          value={values[field]}
          onChange={(event) => update(field, event.target.value)}
        />
      )}
    </FormField>
  )

  const company = values.applicantType === 'company'

  return (
    <form className="card application-form" onSubmit={handleSubmit} noValidate>
      <div className="alert alert--info application-form__notice">
        <InfoIcon width={18} height={18} className="application-form__notice-icon" />
        <p>
          <strong>{t('apply.form.notice.title')}. </strong>
          {t(isSharedData() ? 'apply.form.notice.shared' : 'apply.form.notice.local')}
        </p>
      </div>

      <p className="field__hint">{t('apply.form.requiredHint')}</p>

      {showSummary && hasErrors(errors) && (
        <div className="alert alert--error" role="alert">
          {t('apply.form.errorSummary')}
        </div>
      )}
      {sendError && (
        <div className="alert alert--error" role="alert">
          {sendError === 'failed' ? t('apply.form.sendError') : t(`states.apiLimit.${sendError}`)}
        </div>
      )}

      <fieldset className="application-form__section">
        <legend className="application-form__legend">{t('apply.form.sections.about')}</legend>
        <fieldset className="choice-group" aria-describedby={errors.applicantType ? `${fieldId('applicantType')}-error` : undefined}>
          <legend className="field__label">
            {t('apply.form.fields.applicantType')}
            <span className="field__required" aria-hidden="true">
              *
            </span>
          </legend>
          <div className="choice-group__options">
            {TENANT_TYPES.toReversed().map((type, index) => (
              <label key={type} className="choice-group__option">
                <input
                  type="radio"
                  name={fieldId('applicantType')}
                  id={index === 0 ? fieldId('applicantType') : undefined}
                  value={type}
                  checked={values.applicantType === type}
                  onChange={() => update('applicantType', type)}
                />
                {t(`tenant.type.${type}`)}
              </label>
            ))}
          </div>
          {errors.applicantType && (
            <p id={`${fieldId('applicantType')}-error`} className="field__error">
              {messages.applicantType}
            </p>
          )}
        </fieldset>
        <div className={company ? 'entity-form__row' : undefined}>
          {textField('name', t(company ? 'apply.form.fields.nameCompany' : 'apply.form.fields.namePerson'), {
            required: true,
            autoComplete: company ? 'organization' : 'name',
          })}
          {company && textField('contactPerson', t('apply.form.fields.contactPerson'), { autoComplete: 'name' })}
        </div>
      </fieldset>

      <fieldset className="application-form__section">
        <legend className="application-form__legend">{t('apply.form.sections.contact')}</legend>
        <div className="entity-form__row">
          {textField('email', t('apply.form.fields.email'), {
            required: true,
            type: 'email',
            autoComplete: 'email',
            hint: t('apply.form.hints.email'),
          })}
          {textField('phone', t('apply.form.fields.phone'), {
            type: 'tel',
            autoComplete: 'tel',
            hint: t('apply.form.hints.phone'),
          })}
        </div>
      </fieldset>

      <fieldset className="application-form__section">
        <legend className="application-form__legend">{t('apply.form.sections.moveIn')}</legend>
        <FormField
          id={fieldId('desiredStartDate')}
          label={t('apply.form.fields.desiredStartDate')}
          hint={t('apply.form.hints.desiredStartDate', { example })}
          required
          error={messages.desiredStartDate}
        >
          {(control) => (
            <DateInput
              control={control}
              text={values.desiredStartDate}
              onTextChange={(text) => update('desiredStartDate', text)}
              value={parseDisplayDate(values.desiredStartDate)}
              onSelect={(date) => update('desiredStartDate', formatDate(date))}
              field={t('apply.form.fields.desiredStartDate').toLocaleLowerCase(locale)}
              placeholder={t('apply.form.datePlaceholder')}
            />
          )}
        </FormField>
      </fieldset>

      <fieldset className="application-form__section">
        <legend className="application-form__legend">{t('apply.form.sections.message')}</legend>
        <FormField
          id={fieldId('message')}
          label={t('apply.form.fields.message')}
          hint={t('apply.form.hints.message', { max: APPLICATION_MESSAGE_MAX_LENGTH })}
          error={messages.message}
        >
          {(control) => (
            <textarea
              {...control}
              className="field__input"
              rows={5}
              value={values.message}
              onChange={(event) => update('message', event.target.value)}
            />
          )}
        </FormField>
      </fieldset>

      <div className="application-form__consent">
        <label className="application-form__consent-label">
          <input
            id={fieldId('consent')}
            type="checkbox"
            checked={consent}
            aria-invalid={errors.consent ? true : undefined}
            aria-required
            aria-describedby={errors.consent ? `${fieldId('consent')}-error` : undefined}
            onChange={(event) => {
              setConsent(event.target.checked)
              setErrors(({ consent: _consent, ...rest }) => rest)
            }}
          />
          <span>
            {t('apply.form.fields.consent')}
            <span className="field__required" aria-hidden="true">
              *
            </span>
          </span>
        </label>
        {errors.consent && (
          <p id={`${fieldId('consent')}-error`} className="field__error">
            {messages.consent}
          </p>
        )}
      </div>

      <button type="submit" className="button button--primary application-form__submit" disabled={sending}>
        {sending ? t('apply.form.sending') : t('apply.form.submit')}
      </button>
    </form>
  )
}
