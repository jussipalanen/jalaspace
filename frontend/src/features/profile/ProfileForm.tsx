import { useId, useState, type FormEvent } from 'react'
import { FormField } from '../../components/FormField/FormField'
import { useTranslation } from '../../i18n/useTranslation'
import {
  birthYearOptions,
  dayOptionCount,
  PROFILE_NAME_MAX_LENGTH,
  toProfileForm,
  validateProfileForm,
  type ProfileFormErrors,
  type ProfileFormValues,
} from '../../services/profile'
import type { Profile } from '../../types/profile'
import { hasErrors } from '../../utils/validation'

type Field = keyof ProfileFormValues

const FIELD_ORDER: Field[] = ['firstName', 'lastName', 'birthDay', 'birthMonth', 'birthYear']
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)

interface ProfileFormProps {
  profile: Profile
  email: string
  /** Saves the values; rejecting shows a save error. */
  onSubmit: (values: ProfileFormValues) => Promise<void>
}

export function ProfileForm({ profile, email, onSubmit }: ProfileFormProps) {
  const { t } = useTranslation()
  const idPrefix = useId()
  const [values, setValues] = useState(() => toProfileForm(profile))
  const [errors, setErrors] = useState<ProfileFormErrors>({})
  const [showSummary, setShowSummary] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [saving, setSaving] = useState(false)

  const fieldId = (field: Field | 'email') => `${idPrefix}-${field}`
  const birthHintId = `${idPrefix}-birth-hint`
  const birthErrorId = `${idPrefix}-birth-error`

  const update = (field: Field, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    const errorField = field.startsWith('birth') ? 'birthDate' : field
    setErrors((current) => ({ ...current, [errorField]: undefined }))
    setSaveError(false)
  }

  const nameError = (field: 'firstName' | 'lastName') =>
    errors[field]
      ? t(`settings.profile.validation.${field}.${errors[field]}`, { max: PROFILE_NAME_MAX_LENGTH })
      : undefined

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateProfileForm(values, new Date())
    setErrors(validation)

    if (hasErrors(validation)) {
      setShowSummary(true)
      const firstInvalid = FIELD_ORDER.find((field) =>
        field.startsWith('birth') ? Boolean(validation.birthDate) : field in validation,
      )
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }

    setShowSummary(false)
    setSaveError(false)
    setSaving(true)
    try {
      await onSubmit(values)
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  const dayCount = dayOptionCount(values.birthMonth, values.birthYear)
  // Keep an already chosen day selectable so validation can explain why it is invalid.
  const days = Array.from(
    { length: Math.max(dayCount, Number(values.birthDay) || 0) },
    (_, index) => index + 1,
  )
  const birthDescribedBy = [birthHintId, errors.birthDate ? birthErrorId : null]
    .filter(Boolean)
    .join(' ')
  const birthSelect = (field: 'birthDay' | 'birthMonth' | 'birthYear', options: number[]) => (
    <select
      id={fieldId(field)}
      className="field__input"
      value={values[field]}
      onChange={(event) => update(field, event.target.value)}
      aria-invalid={errors.birthDate ? true : undefined}
      aria-describedby={birthDescribedBy}
    >
      <option value="">{t('settings.profile.notSelected')}</option>
      {options.map((option) => (
        <option key={option} value={String(option)}>
          {option}
        </option>
      ))}
    </select>
  )

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>
      {showSummary && hasErrors(errors) && (
        <div className="alert alert--error" role="alert">
          {t('settings.profile.errorSummary')}
        </div>
      )}
      {saveError && (
        <div className="alert alert--error" role="alert">
          {t('settings.profile.saveError')}
        </div>
      )}

      <FormField
        id={fieldId('email')}
        label={t('settings.profile.email')}
        hint={t('settings.profile.emailHint')}
      >
        {(control) => (
          <input {...control} className="field__input" type="email" value={email} readOnly />
        )}
      </FormField>

      <div className="profile-form__row">
        <FormField
          id={fieldId('firstName')}
          label={t('settings.profile.firstName')}
          required
          error={nameError('firstName')}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              autoComplete="given-name"
              value={values.firstName}
              onChange={(event) => update('firstName', event.target.value)}
            />
          )}
        </FormField>

        <FormField
          id={fieldId('lastName')}
          label={t('settings.profile.lastName')}
          required
          error={nameError('lastName')}
        >
          {(control) => (
            <input
              {...control}
              className="field__input"
              autoComplete="family-name"
              value={values.lastName}
              onChange={(event) => update('lastName', event.target.value)}
            />
          )}
        </FormField>
      </div>

      <fieldset className="profile-form__birthdate">
        <legend className="field__label">{t('settings.profile.birthDate')}</legend>
        <p id={birthHintId} className="field__hint">
          {t('settings.profile.birthDateHint')}
        </p>
        <div className="profile-form__date">
          <div className="field">
            <label className="field__label profile-form__part" htmlFor={fieldId('birthDay')}>
              {t('settings.profile.day')}
            </label>
            {birthSelect('birthDay', days)}
          </div>
          <div className="field">
            <label className="field__label profile-form__part" htmlFor={fieldId('birthMonth')}>
              {t('settings.profile.month')}
            </label>
            {birthSelect('birthMonth', MONTHS)}
          </div>
          <div className="field">
            <label className="field__label profile-form__part" htmlFor={fieldId('birthYear')}>
              {t('settings.profile.year')}
            </label>
            {birthSelect('birthYear', birthYearOptions(new Date()))}
          </div>
        </div>
        {errors.birthDate && (
          <p id={birthErrorId} className="field__error">
            {t(`settings.profile.validation.birthDate.${errors.birthDate}`)}
          </p>
        )}
      </fieldset>

      <div className="profile-form__actions">
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? t('settings.profile.saving') : t('settings.profile.save')}
        </button>
      </div>
    </form>
  )
}
