import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { flashState } from '../components/FlashMessage/flash'
import { BuildingIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { PropertyForm } from '../features/properties/PropertyForm'
import { useAsyncData } from '../hooks/useAsyncData'
import { useDataLayer } from '../hooks/useDataLayer'
import { useTranslation } from '../i18n/useTranslation'
import { createProperty, updateProperty } from '../services/propertyService'
import { emptyPropertyForm, toPropertyForm, type PropertyFormValues } from '../services/properties'

export function NewPropertyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()

  const save = async (values: PropertyFormValues) => {
    const property = await createProperty(getDataLayer(), values)
    navigate(`/properties/${property.id}`, {
      state: flashState(t('properties.flash.created', { name: property.name })),
    })
  }

  return (
    <>
      <PageHeader
        title={t('properties.form.createTitle')}
        description={t('properties.form.createDescription')}
      />
      <PropertyForm initialValues={emptyPropertyForm()} cancelTo="/properties" onSubmit={save} />
    </>
  )
}

export function EditPropertyPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()
  const load = useCallback(() => getDataLayer().properties.getById(id), [getDataLayer, id])
  const state = useAsyncData(load)

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('properties.detail.loadError')} onRetry={state.reload} />
  }
  const property = state.data
  if (!property) {
    return (
      <EmptyState
        headingLevel="h1"
        icon={BuildingIcon}
        title={t('properties.detail.notFoundTitle')}
        description={t('properties.detail.notFoundDescription')}
      >
        <Link to="/properties" className="button button--secondary">
          {t('properties.detail.back')}
        </Link>
      </EmptyState>
    )
  }

  const save = async (values: PropertyFormValues) => {
    const updated = await updateProperty(getDataLayer(), property.id, values)
    navigate(`/properties/${updated.id}`, {
      state: flashState(t('properties.flash.updated', { name: updated.name })),
    })
  }

  return (
    <>
      <PageHeader
        title={t('properties.form.editTitle')}
        description={t('properties.form.editDescription', { name: property.name })}
      />
      <PropertyForm
        initialValues={toPropertyForm(property)}
        cancelTo={`/properties/${property.id}`}
        onSubmit={save}
      />
    </>
  )
}
