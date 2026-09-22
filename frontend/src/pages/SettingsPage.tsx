import { useNavigate } from 'react-router'
import { LoadingState } from '../components/DataState/DataState'
import { flashState } from '../components/FlashMessage/flash'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { ProfileForm } from '../features/profile/ProfileForm'
import { useProfile } from '../features/profile/useProfile'
import { useTranslation } from '../i18n/useTranslation'
import type { ProfileFormValues } from '../services/profile'
import './SettingsPage.css'

export function SettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile, loaded, email, saveProfile } = useProfile()

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
          <ProfileForm profile={profile} email={email} onSubmit={save} />
        ) : (
          <LoadingState />
        )}
      </section>

      <p className="settings-note">{t('settings.otherSections')}</p>
    </>
  )
}
