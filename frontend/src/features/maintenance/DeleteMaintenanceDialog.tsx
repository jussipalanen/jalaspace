import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { flashState } from '../../components/FlashMessage/flash'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useTranslation } from '../../i18n/useTranslation'
import { deleteMaintenance } from '../../services/maintenanceService'
import type { MaintenanceTask } from '../../types/maintenance'
import { saveErrorMessage } from '../../utils/apiLimits'

interface DeleteMaintenanceDialogProps {
  open: boolean
  task: MaintenanceTask
  onClose: () => void
}

export function DeleteMaintenanceDialog({ open, task, onClose }: DeleteMaintenanceDialogProps) {
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
      await deleteMaintenance(getDataLayer(), task.id)
      navigate('/maintenance', {
        state: flashState(t('maintenance.flash.deleted', { title: task.title })),
      })
    } catch (caught) {
      setBusy(false)
      setError(saveErrorMessage(caught, t, t('maintenance.delete.error')))
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={t('maintenance.delete.title', { title: task.title })}
      cancelLabel={t('maintenance.delete.cancel')}
      onCancel={close}
      error={error}
      confirm={{
        label: t('maintenance.delete.confirm'),
        busyLabel: t('maintenance.delete.deleting'),
        busy,
        onConfirm: () => void confirmDelete(),
      }}
    >
      <p>{t('maintenance.delete.description')}</p>
    </ConfirmDialog>
  )
}
