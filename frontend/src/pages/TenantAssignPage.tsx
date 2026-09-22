import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { flashState } from '../components/FlashMessage/flash'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { AssignSpaceForm } from '../features/tenants/AssignSpaceForm'
import { TenantNotFound } from '../features/tenants/TenantNotFound'
import { useTenantData } from '../features/tenants/useTenantData'
import { useDataLayer } from '../hooks/useDataLayer'
import { useTranslation } from '../i18n/useTranslation'
import { getLeaseStatus } from '../services/leases'
import { assignTenantToSpace } from '../services/tenantService'
import { emptyAssignmentForm, type AssignmentFormValues } from '../services/tenants'
import { toIsoDate } from '../utils/date'
import { formatDate } from '../utils/format'

export function TenantAssignPage() {
  const { id = '' } = useParams()
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()
  const state = useTenantData()
  const data = state.status === 'success' ? state.data : null
  const properties = useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true })
    return (data?.properties ?? []).toSorted((a, b) => collator.compare(a.name, b.name))
  }, [data, locale])

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('tenants.loadError')} onRetry={state.reload} />
  }

  const tenant = state.data.tenants.find((item) => item.id === id)
  if (!tenant) return <TenantNotFound />
  const today = toIsoDate(new Date())

  const save = async (values: AssignmentFormValues) => {
    const { lease, space } = await assignTenantToSpace(getDataLayer(), tenant.id, values)
    const message =
      getLeaseStatus(lease, toIsoDate(new Date())) === 'upcoming'
        ? t('tenants.flash.reserved', {
            name: tenant.name,
            space: space.name,
            date: formatDate(lease.startDate),
          })
        : t('tenants.flash.assigned', { name: tenant.name, space: space.name })
    navigate(`/tenants/${tenant.id}`, { state: flashState(message) })
  }

  return (
    <>
      <PageHeader
        title={t('tenants.assign.title', { name: tenant.name })}
        description={t('tenants.assign.description')}
      />
      <AssignSpaceForm
        initialValues={emptyAssignmentForm(today)}
        properties={properties}
        spaces={state.data.spaces}
        leases={state.data.leases}
        today={today}
        cancelTo={`/tenants/${tenant.id}`}
        onSubmit={save}
      />
    </>
  )
}
