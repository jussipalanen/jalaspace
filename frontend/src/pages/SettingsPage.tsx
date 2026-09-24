import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { LoadingState } from '../components/DataState/DataState'
import { flashState } from '../components/FlashMessage/flash'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { isSharedData } from '../config/dataProvider'
import { ProfileForm } from '../features/profile/ProfileForm'
import { useProfile } from '../features/profile/useProfile'
import { DemoDataSettings } from '../features/settings/DemoDataSettings'
import { LanguageSettings } from '../features/settings/LanguageSettings'
import { useTranslation } from '../i18n/useTranslation'
import type { ProfileFormValues } from '../services/profile'
import './SettingsPage.css'

export function SettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile, loaded, email, saveProfile } = useProfile()
  const { hash } = useLocation()

  // Links such as /settings#language open the section, also from within the app.
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [hash])

  const save = async (values: ProfileFormValues) => {
    await saveProfile(values)
    // Re-enter the page with a one-time success message; the form keeps its values.
    navigate('/settings', { replace: true, state: flashState(t('settings.profile.saved')) })
  }

  return (
    <>
      <PageHeader title={t('pages.settings.title')} description={t('pages.settings.description')} />

      <section id="profile" className="card settings-section" aria-labelledby="settings-profile-title">
        <div className="settings-section__header">
          <h2 id="settings-profile-title" className="section__title">
            {t('settings.profile.title')}
          </h2>
          <p className="settings-section__description">{t('settings.profile.description')}</p>
        </div>
        {loaded && profile ? (
          // Keyed by the save time, so the form shows the restored profile after a demo reset.
          <ProfileForm key={profile.updatedAt} profile={profile} email={email} onSubmit={save} />
        ) : (
          <LoadingState />
        )}
      </section>

      <section
        id="language"
        className="card settings-section"
        aria-labelledby="settings-language-title"
      >
        <div className="settings-section__header">
          <h2 id="settings-language-title" className="section__title">
            {t('settings.language.title')}
          </h2>
          <p className="settings-section__description">{t('settings.language.description')}</p>
        </div>
        <LanguageSettings />
      </section>

      <section
        id="demo-data"
        className="card settings-section"
        aria-labelledby="settings-demo-data-title"
      >
        <div className="settings-section__header">
          <h2 id="settings-demo-data-title" className="section__title">
            {t('settings.demoData.title')}
          </h2>
          <p className="settings-section__description">
            {t(isSharedData() ? 'settings.demoData.descriptionShared' : 'settings.demoData.description')}
          </p>
        </div>
        <DemoDataSettings />
      </section>

      <p className="settings-note">{t('settings.otherSections')}</p>
    </>
  )
}
