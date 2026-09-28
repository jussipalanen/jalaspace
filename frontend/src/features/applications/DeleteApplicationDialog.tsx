import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { flashState } from '../../components/FlashMessage/flash'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useTranslation } from '../../i18n/useTranslation'
import { deleteApplication } from '../../services/applicationService'
import type { Application } from '../../types/application'
import { saveErrorMessage } from '../../utils/apiLimits'

interface DeleteApplicationDialogProps {
  open: boolean
  application: Application
  onClose: () => void
}

export function DeleteApplicationDialog({ open, application, onClose }: DeleteApplicationDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setError(null)
    onClose()
  }

  const confirmDelete = async () => {
    setBusy(true)
    setError(null)
    try {
      await deleteApplication(getDataLayer(), application.id)
      navigate('/applications', {
        state: flashState(t('applications.flash.deleted', { name: application.name })),
      })
    } catch (caught) {
      setBusy(false)
      setError(saveErrorMessage(caught, t, t('applications.delete.error')))
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={t('applications.delete.title', { name: application.name })}
      cancelLabel={t('applications.delete.cancel')}
      onCancel={close}
      error={error}
      confirm={{
        label: t('applications.delete.confirm'),
        busyLabel: t('applications.delete.deleting'),
        busy,
        onConfirm: () => void confirmDelete(),
      }}
    >
      <p>{t('applications.delete.description')}</p>
    </ConfirmDialog>
  )
}
