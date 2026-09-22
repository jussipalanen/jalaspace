import { useId } from 'react'
import { FormField } from '../../components/FormField/FormField'
import { isLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../../i18n/languages'
import { useTranslation } from '../../i18n/useTranslation'

/** The same choice as the header language switcher; it applies immediately. */
export function LanguageSettings() {
  const { t, language, setLanguage } = useTranslation()
  const id = useId()

  return (
    <div className="language-settings">
      <FormField id={id} label={t('settings.language.label')} hint={t('settings.language.hint')}>
        {(control) => (
          <select
            {...control}
            className="field__input"
            value={language}
            onChange={(event) => {
              if (isLanguage(event.target.value)) setLanguage(event.target.value)
            }}
          >
            {SUPPORTED_LANGUAGES.map((code) => (
              <option key={code} value={code} lang={code}>
                {LANGUAGE_NAMES[code]}
              </option>
            ))}
          </select>
        )}
      </FormField>
    </div>
  )
}
