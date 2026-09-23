import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { flashState } from '../../components/FlashMessage/flash'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useTranslation } from '../../i18n/useTranslation'
import { deleteSpace, SpaceDeletionBlockedError } from '../../services/spaceService'
import type { SpaceDeletionCheck } from '../../services/spaces'
import type { Space } from '../../types/space'
import { saveErrorMessage } from '../../utils/apiLimits'

interface DeleteSpaceDialogProps {
  open: boolean
  space: Space
  deletion: SpaceDeletionCheck
  onClose: () => void
  /** Called when the delete was blocked by data that changed meanwhile. */
  onBlocked: () => void
}

export function DeleteSpaceDialog({ open, space, deletion, onClose, onBlocked }: DeleteSpaceDialogProps) {
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
      await deleteSpace(getDataLayer(), space.id)
      navigate(`/units?property=${space.propertyId}`, {
        state: flashState(t('spaces.flash.deleted', { name: space.name })),
      })
    } catch (caught) {
      setBusy(false)
      if (caught instanceof SpaceDeletionBlockedError) onBlocked()
      else setError(saveErrorMessage(caught, t, t('spaces.delete.error')))
    }
  }

  if (!deletion.allowed) {
    return (
      <ConfirmDialog
        open={open}
        title={t('spaces.delete.blockedTitle', { name: space.name })}
        cancelLabel={t('spaces.delete.close')}
        onCancel={close}
      >
        <p>{t('spaces.delete.blockedDescription')}</p>
        <ul>
          {deletion.leaseCount > 0 && (
            <li>{t('spaces.delete.blockedLeases', { count: deletion.leaseCount })}</li>
          )}
          {deletion.maintenanceCount > 0 && (
            <li>{t('spaces.delete.blockedMaintenance', { count: deletion.maintenanceCount })}</li>
          )}
        </ul>
      </ConfirmDialog>
    )
  }

  return (
    <ConfirmDialog
      open={open}
      title={t('spaces.delete.title', { name: space.name })}
      cancelLabel={t('spaces.delete.cancel')}
      onCancel={close}
      error={error}
      confirm={{
        label: t('spaces.delete.confirm'),
        busyLabel: t('spaces.delete.deleting'),
        busy,
        onConfirm: () => void confirmDelete(),
      }}
    >
      <p>{t('spaces.delete.description')}</p>
    </ConfirmDialog>
  )
}
