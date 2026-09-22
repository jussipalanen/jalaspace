import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { flashState } from '../../components/FlashMessage/flash'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useTranslation } from '../../i18n/useTranslation'
import { deleteTenant, TenantDeletionBlockedError } from '../../services/tenantService'
import type { TenantDeletionCheck } from '../../services/tenants'
import type { Tenant } from '../../types/tenant'

interface DeleteTenantDialogProps {
  open: boolean
  tenant: Tenant
  deletion: TenantDeletionCheck
  onClose: () => void
  /** Called when the delete was blocked by data that changed meanwhile. */
  onBlocked: () => void
}

export function DeleteTenantDialog({ open, tenant, deletion, onClose, onBlocked }: DeleteTenantDialogProps) {
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
      await deleteTenant(getDataLayer(), tenant.id)
      navigate('/tenants', {
        state: flashState(t('tenants.flash.deleted', { name: tenant.name })),
      })
    } catch (caught) {
      setBusy(false)
      if (caught instanceof TenantDeletionBlockedError) onBlocked()
      else setError(t('tenants.delete.error'))
    }
  }

  if (!deletion.allowed) {
    return (
      <ConfirmDialog
        open={open}
        title={t('tenants.delete.blockedTitle', { name: tenant.name })}
        cancelLabel={t('tenants.delete.close')}
        onCancel={close}
      >
        <p>{t('tenants.delete.blockedDescription')}</p>
        <ul>
          <li>{t('tenants.delete.blockedLeases', { count: deletion.leaseCount })}</li>
        </ul>
      </ConfirmDialog>
    )
  }

  return (
    <ConfirmDialog
      open={open}
      title={t('tenants.delete.title', { name: tenant.name })}
      cancelLabel={t('tenants.delete.cancel')}
      onCancel={close}
      error={error}
      confirm={{
        label: t('tenants.delete.confirm'),
        busyLabel: t('tenants.delete.deleting'),
        busy,
        onConfirm: () => void confirmDelete(),
      }}
    >
      <p>{t('tenants.delete.description')}</p>
    </ConfirmDialog>
  )
}
