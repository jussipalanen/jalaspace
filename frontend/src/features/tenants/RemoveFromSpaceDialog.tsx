import { useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useTranslation } from '../../i18n/useTranslation'
import { removeTenantFromSpace } from '../../services/tenantService'
import { planRemoval, type TenantLease } from '../../services/tenants'
import type { Tenant } from '../../types/tenant'
import { toIsoDate } from '../../utils/date'
import { formatDate } from '../../utils/format'
import { saveErrorMessage } from '../../utils/apiLimits'

interface RemoveFromSpaceDialogProps {
  tenant: Tenant
  /** The lease to end or cancel; `null` keeps the dialog closed. */
  entry: TenantLease | null
  onClose: () => void
  /** Called after the lease was ended or cancelled, with the success message. */
  onRemoved: (message: string) => void
}

export function RemoveFromSpaceDialog({ tenant, entry, onClose, onRemoved }: RemoveFromSpaceDialogProps) {
  const { t } = useTranslation()
  const getDataLayer = useDataLayer()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const space = entry?.space?.name ?? t('tenants.detail.unknownSpace')
  const plan = entry ? planRemoval(entry.lease, toIsoDate(new Date())) : null
  const cancelling = plan?.action === 'cancel'

  const close = () => {
    setError(null)
    onClose()
  }

  const confirmRemove = async () => {
    if (!entry) return
    setBusy(true)
    setError(null)
    try {
      const { action } = await removeTenantFromSpace(getDataLayer(), entry.lease.id)
      setBusy(false)
      onRemoved(
        action === 'cancel'
          ? t('tenants.flash.cancelled', { space })
          : t('tenants.flash.removed', { name: tenant.name, space }),
      )
    } catch (caught) {
      setBusy(false)
      setError(saveErrorMessage(caught, t, t('tenants.remove.error')))
    }
  }

  return (
    <ConfirmDialog
      open={entry !== null}
      title={
        cancelling
          ? t('tenants.remove.cancelTitle', { space })
          : t('tenants.remove.endTitle', { name: tenant.name, space })
      }
      cancelLabel={t('tenants.remove.back')}
      onCancel={close}
      error={error}
      confirm={{
        label: cancelling ? t('tenants.remove.cancelConfirm') : t('tenants.remove.confirm'),
        busyLabel: t('tenants.remove.busy'),
        busy,
        onConfirm: () => void confirmRemove(),
      }}
    >
      <p>
        {plan?.action === 'end'
          ? t('tenants.remove.endDescription', { date: formatDate(plan.endDate) })
          : t('tenants.remove.cancelDescription')}
      </p>
    </ConfirmDialog>
  )
}
