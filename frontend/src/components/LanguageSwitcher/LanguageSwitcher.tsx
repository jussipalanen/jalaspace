import { useId } from 'react'
import { isLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../../i18n/languages'
import { useTranslation } from '../../i18n/useTranslation'
import { GlobeIcon } from '../icons'
import './LanguageSwitcher.css'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation()
  const id = useId()

  return (
    <div className="language-switcher">
      <label htmlFor={id} className="visually-hidden">
        {t('language.label')}
      </label>
      <GlobeIcon className="language-switcher__icon" width={16} height={16} />
      <select
        id={id}
        className="language-switcher__select"
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
    </div>
  )
}
