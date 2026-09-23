import { useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { isSharedData } from '../../config/dataProvider'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useTranslation } from '../../i18n/useTranslation'
import type { DataLayer } from '../../repositories'
import type { DemoDataStore } from '../../repositories/DemoDataStore'
import { resetDemoData } from '../../services/demoDataService'
import { useProfile } from '../profile/useProfile'

/** The provider's demo data support, or `null` when it cannot be reset (or is misconfigured). */
function demoDataStore(getDataLayer: () => DataLayer): DemoDataStore | null {
  try {
    return getDataLayer().demoData
  } catch {
    return null
  }
}

export function DemoDataSettings() {
  const { t } = useTranslation()
  const getDataLayer = useDataLayer()
  const { reloadProfile } = useProfile()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const store = demoDataStore(getDataLayer)
  if (!store) {
    return <p className="settings-section__note">{t('settings.demoData.unavailable')}</p>
  }

  const close = () => {
    setError(null)
    setConfirming(false)
  }

  const confirmReset = async () => {
    setBusy(true)
    setError(null)
    try {
      await resetDemoData(store)
      await reloadProfile()
      setConfirming(false)
      setDone(true)
    } catch (caught) {
      if (import.meta.env.DEV) console.error('Resetting demo data failed', caught)
      setError(t('settings.demoData.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ul className="settings-section__list">
        <li>{t('settings.demoData.resets')}</li>
        <li>{t('settings.demoData.keeps')}</li>
      </ul>
      <div className="settings-section__actions">
        <button
          type="button"
          className="button button--danger"
          onClick={() => {
            setDone(false)
            setConfirming(true)
          }}
        >
          {t('settings.demoData.reset')}
        </button>
      </div>
      {/* Shown next to the button: a page-level message would be out of view here. */}
      <div role="status" className="settings-section__status">
        {done && <p className="alert alert--success">{t('settings.demoData.done')}</p>}
      </div>

      <ConfirmDialog
        open={confirming}
        title={t('settings.demoData.confirm.title')}
        cancelLabel={t('settings.demoData.confirm.cancel')}
        onCancel={close}
        confirm={{
          label: t('settings.demoData.confirm.confirm'),
          busyLabel: t('settings.demoData.confirm.busy'),
          busy,
          onConfirm: confirmReset,
        }}
        error={error}
      >
        <p>
          {t(
            isSharedData()
              ? 'settings.demoData.confirm.descriptionShared'
              : 'settings.demoData.confirm.description',
          )}
        </p>
      </ConfirmDialog>
    </>
  )
}
