import { useNavigate, useParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { flashState } from '../components/FlashMessage/flash'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { TenantForm } from '../features/tenants/TenantForm'
import { TenantNotFound } from '../features/tenants/TenantNotFound'
import { useTenantData } from '../features/tenants/useTenantData'
import { useDataLayer } from '../hooks/useDataLayer'
import { useTranslation } from '../i18n/useTranslation'
import { createTenant, updateTenant } from '../services/tenantService'
import { emptyTenantForm, toTenantForm, type TenantFormValues } from '../services/tenants'

export function NewTenantPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()
  const state = useTenantData()

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('tenants.loadError')} onRetry={state.reload} />
  }

  const save = async (values: TenantFormValues) => {
    const tenant = await createTenant(getDataLayer(), values)
    navigate(`/tenants/${tenant.id}`, {
      state: flashState(t('tenants.flash.created', { name: tenant.name })),
    })
  }

  return (
    <>
      <PageHeader
        title={t('tenants.form.createTitle')}
        description={t('tenants.form.createDescription')}
      />
      <TenantForm
        initialValues={emptyTenantForm()}
        tenants={state.data.tenants}
        cancelTo="/tenants"
        onSubmit={save}
      />
    </>
  )
}

export function EditTenantPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()
  const state = useTenantData()

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('tenants.loadError')} onRetry={state.reload} />
  }

  const tenant = state.data.tenants.find((item) => item.id === id)
  if (!tenant) return <TenantNotFound />

  const save = async (values: TenantFormValues) => {
    const updated = await updateTenant(getDataLayer(), tenant.id, values)
    navigate(`/tenants/${updated.id}`, {
      state: flashState(t('tenants.flash.updated', { name: updated.name })),
    })
  }

  return (
    <>
      <PageHeader
        title={t('tenants.form.editTitle')}
        description={t('tenants.form.editDescription', { name: tenant.name })}
      />
      <TenantForm
        initialValues={toTenantForm(tenant)}
        tenants={state.data.tenants}
        editingId={tenant.id}
        cancelTo={`/tenants/${tenant.id}`}
        onSubmit={save}
      />
    </>
  )
}
