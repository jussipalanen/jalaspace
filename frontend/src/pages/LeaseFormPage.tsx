import { useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { flashState } from '../components/FlashMessage/flash'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { LeaseForm } from '../features/leases/LeaseForm'
import { LeaseNotFound } from '../features/leases/LeaseNotFound'
import { useLeaseData } from '../features/leases/useLeaseData'
import { useDataLayer } from '../hooks/useDataLayer'
import { useTranslation } from '../i18n/useTranslation'
import { createLease, updateLease, type LeaseData } from '../services/leaseService'
import { emptyLeaseForm, toLeaseForm, type LeaseFormValues } from '../services/leases'
import { toIsoDate } from '../utils/date'

/** Only same-app paths, so a link cannot send the user to another site. */
function safeReturnTo(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null
}

function useSortedData(data: LeaseData | null) {
  const { locale } = useTranslation()
  return useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true })
    return {
      tenants: (data?.tenants ?? []).toSorted((a, b) => collator.compare(a.name, b.name)),
      properties: (data?.properties ?? []).toSorted((a, b) => collator.compare(a.name, b.name)),
    }
  }, [data, locale])
}

export function NewLeasePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const getDataLayer = useDataLayer()
  const state = useLeaseData()
  const sorted = useSortedData(state.status === 'success' ? state.data : null)

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('leases.loadError')} onRetry={state.reload} />
  }

  const { data } = state
  const today = toIsoDate(new Date())
  const returnTo = safeReturnTo(searchParams.get('returnTo'))
  // Preselect the tenant or space when coming from their pages (?tenant=…, ?space=…).
  const tenantId = searchParams.get('tenant') ?? ''
  const space = data.spaces.find((item) => item.id === searchParams.get('space'))
  const initialValues = emptyLeaseForm(today, {
    tenantId: data.tenants.some((tenant) => tenant.id === tenantId) ? tenantId : '',
    propertyId: space?.propertyId,
    spaceId: space?.id,
  })

  const save = async (values: LeaseFormValues) => {
    const lease = await createLease(getDataLayer(), values)
    const tenant = data.tenants.find((item) => item.id === lease.tenantId)
    const leasedSpace = data.spaces.find((item) => item.id === lease.spaceId)
    navigate(returnTo ?? '/leases', {
      state: flashState(
        t('leases.flash.created', { tenant: tenant?.name ?? '', space: leasedSpace?.name ?? '' }),
      ),
    })
  }

  return (
    <>
      <PageHeader title={t('leases.form.createTitle')} description={t('leases.form.createDescription')} />
      <LeaseForm
        initialValues={initialValues}
        tenants={sorted.tenants}
        properties={sorted.properties}
        spaces={data.spaces}
        leases={data.leases}
        today={today}
        cancelTo={returnTo ?? '/leases'}
        onSubmit={save}
      />
    </>
  )
}

export function EditLeasePage() {
  const { id = '' } = useParams()
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const getDataLayer = useDataLayer()
  const state = useLeaseData()
  const sorted = useSortedData(state.status === 'success' ? state.data : null)

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('leases.loadError')} onRetry={state.reload} />
  }

  const { data } = state
  const lease = data.leases.find((item) => item.id === id)
  if (!lease) return <LeaseNotFound />
  const tenant = data.tenants.find((item) => item.id === lease.tenantId) ?? null
  const space = data.spaces.find((item) => item.id === lease.spaceId) ?? null
  const property = data.properties.find((item) => item.id === space?.propertyId) ?? null
  const returnTo = safeReturnTo(searchParams.get('returnTo')) ?? '/leases'
  const spaceName = space?.name ?? t('leases.unknownSpace')

  const save = async (values: LeaseFormValues) => {
    await updateLease(getDataLayer(), lease.id, values)
    navigate(returnTo, { state: flashState(t('leases.flash.updated', { space: spaceName })) })
  }

  return (
    <>
      <PageHeader
        title={t('leases.form.editTitle')}
        description={t('leases.form.editDescription', {
          tenant: tenant?.name ?? t('leases.unknownTenant'),
          space: spaceName,
          property: property?.name ?? '',
        })}
      />
      <LeaseForm
        initialValues={toLeaseForm(lease, space, locale)}
        tenants={sorted.tenants}
        properties={sorted.properties}
        spaces={data.spaces}
        leases={data.leases}
        today={toIsoDate(new Date())}
        editing={{ id: lease.id, tenant, space, property }}
        cancelTo={returnTo}
        onSubmit={save}
      />
    </>
  )
}
