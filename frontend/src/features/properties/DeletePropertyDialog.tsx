import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { flashState } from '../../components/FlashMessage/flash'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useTranslation } from '../../i18n/useTranslation'
import { deleteProperty, PropertyDeletionBlockedError } from '../../services/propertyService'
import type { PropertyDeletionCheck } from '../../services/properties'
import type { Property } from '../../types/property'
import { saveErrorMessage } from '../../utils/apiLimits'

interface DeletePropertyDialogProps {
  open: boolean
  property: Property
  deletion: PropertyDeletionCheck
  onClose: () => void
  /** Called when the delete was blocked by data that changed meanwhile. */
  onBlocked: () => void
}

export function DeletePropertyDialog({
  open,
  property,
  deletion,
  onClose,
  onBlocked,
}: DeletePropertyDialogProps) {
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
      await deleteProperty(getDataLayer(), property.id)
      navigate('/properties', {
        state: flashState(t('properties.flash.deleted', { name: property.name })),
      })
    } catch (caught) {
      setBusy(false)
      if (caught instanceof PropertyDeletionBlockedError) onBlocked()
      else setError(saveErrorMessage(caught, t, t('properties.delete.error')))
    }
  }

  if (!deletion.allowed) {
    return (
      <ConfirmDialog
        open={open}
        title={t('properties.delete.blockedTitle', { name: property.name })}
        cancelLabel={t('properties.delete.close')}
        onCancel={close}
      >
        <p>{t('properties.delete.blockedDescription')}</p>
        <ul>
          {deletion.spaceCount > 0 && (
            <li>{t('properties.delete.blockedSpaces', { count: deletion.spaceCount })}</li>
          )}
          {deletion.maintenanceCount > 0 && (
            <li>
              {t('properties.delete.blockedMaintenance', { count: deletion.maintenanceCount })}
            </li>
          )}
        </ul>
      </ConfirmDialog>
    )
  }

  return (
    <ConfirmDialog
      open={open}
      title={t('properties.delete.title', { name: property.name })}
      cancelLabel={t('properties.delete.cancel')}
      onCancel={close}
      error={error}
      confirm={{
        label: t('properties.delete.confirm'),
        busyLabel: t('properties.delete.deleting'),
        busy,
        onConfirm: () => void confirmDelete(),
      }}
    >
      <p>{t('properties.delete.description')}</p>
    </ConfirmDialog>
  )
}
