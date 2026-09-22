import { useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { flashState } from '../components/FlashMessage/flash'
import { BuildingIcon, PlusIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { MaintenanceForm } from '../features/maintenance/MaintenanceForm'
import { MaintenanceNotFound } from '../features/maintenance/MaintenanceNotFound'
import { useMaintenanceData } from '../features/maintenance/useMaintenanceData'
import { useDataLayer } from '../hooks/useDataLayer'
import { useTranslation } from '../i18n/useTranslation'
import { emptyMaintenanceForm, toMaintenanceForm, type MaintenanceFormValues } from '../services/maintenance'
import {
  createMaintenance,
  getMaintenanceDetails,
  updateMaintenance,
} from '../services/maintenanceService'
import type { Property } from '../types/property'

function useSortedProperties(properties: Property[] | undefined) {
  const { locale } = useTranslation()
  return useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true })
    return (properties ?? []).toSorted((a, b) => collator.compare(a.name, b.name))
  }, [properties, locale])
}

export function NewMaintenancePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const getDataLayer = useDataLayer()
  const state = useMaintenanceData()
  const properties = useSortedProperties(
    state.status === 'success' ? state.data.properties : undefined,
  )

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('maintenance.loadError')} onRetry={state.reload} />
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        headingLevel="h1"
        icon={BuildingIcon}
        title={t('maintenance.noProperties.title')}
        description={t('maintenance.noProperties.description')}
      >
        <Link to="/properties/new" className="button button--primary">
          <PlusIcon width={16} height={16} />
          {t('maintenance.noProperties.action')}
        </Link>
      </EmptyState>
    )
  }

  // Preselect the property when coming from its details page (?property=…).
  const requested = searchParams.get('property') ?? ''
  const propertyId = properties.some((property) => property.id === requested) ? requested : ''

  const save = async (values: MaintenanceFormValues) => {
    const task = await createMaintenance(getDataLayer(), values)
    navigate(`/maintenance/${task.id}`, {
      state: flashState(t('maintenance.flash.created', { title: task.title })),
    })
  }

  return (
    <>
      <PageHeader
        title={t('maintenance.form.createTitle')}
        description={t('maintenance.form.createDescription')}
      />
      <MaintenanceForm
        initialValues={emptyMaintenanceForm(propertyId)}
        properties={properties}
        spaces={state.data.spaces}
        cancelTo={propertyId ? `/properties/${propertyId}` : '/maintenance'}
        onSubmit={save}
      />
    </>
  )
}

export function EditMaintenancePage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()
  const state = useMaintenanceData()
  const properties = useSortedProperties(
    state.status === 'success' ? state.data.properties : undefined,
  )

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('maintenance.loadError')} onRetry={state.reload} />
  }

  const details = getMaintenanceDetails(state.data, id)
  if (!details) return <MaintenanceNotFound />
  const { task } = details

  const save = async (values: MaintenanceFormValues) => {
    const updated = await updateMaintenance(getDataLayer(), task.id, values)
    navigate(`/maintenance/${updated.id}`, {
      state: flashState(t('maintenance.flash.updated', { title: updated.title })),
    })
  }

  return (
    <>
      <PageHeader
        title={t('maintenance.form.editTitle')}
        description={t('maintenance.form.editDescription', { title: task.title })}
      />
      <MaintenanceForm
        initialValues={toMaintenanceForm(task)}
        properties={properties}
        spaces={state.data.spaces}
        cancelTo={`/maintenance/${task.id}`}
        onSubmit={save}
      />
    </>
  )
}
