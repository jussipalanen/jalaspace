import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { flashState } from '../components/FlashMessage/flash'
import { LayoutGridIcon, TrashIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { DeleteSpaceDialog } from '../features/spaces/DeleteSpaceDialog'
import { SpaceForm } from '../features/spaces/SpaceForm'
import { useSpaceData } from '../features/spaces/useSpaceData'
import { useDataLayer } from '../hooks/useDataLayer'
import { useTranslation } from '../i18n/useTranslation'
import type { Property } from '../types/property'
import { createSpace, getSpaceEditContext, updateSpace } from '../services/spaceService'
import { emptySpaceForm, toSpaceForm, type SpaceFormValues } from '../services/spaces'
import { toIsoDate } from '../utils/date'
import './SpaceFormPage.css'

function useSortedProperties(properties: Property[] | undefined) {
  const { locale } = useTranslation()
  return useMemo(() => {
    const collator = new Intl.Collator(locale, { numeric: true })
    return (properties ?? []).toSorted((a, b) => collator.compare(a.name, b.name))
  }, [properties, locale])
}

export function NewSpacePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const getDataLayer = useDataLayer()
  const state = useSpaceData()
  const properties = useSortedProperties(state.status === 'success' ? state.data.properties : undefined)

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('spaces.loadError')} onRetry={state.reload} />
  }

  // Preselect the property when coming from its details page (?property=…).
  const requested = searchParams.get('property') ?? ''
  const propertyId = properties.some((property) => property.id === requested) ? requested : ''

  const save = async (values: SpaceFormValues) => {
    const space = await createSpace(getDataLayer(), values)
    navigate(`/units?property=${space.propertyId}`, {
      state: flashState(t('spaces.flash.created', { name: space.name })),
    })
  }

  return (
    <>
      <PageHeader
        title={t('spaces.form.createTitle')}
        description={t('spaces.form.createDescription')}
      />
      <SpaceForm
        initialValues={emptySpaceForm(propertyId)}
        properties={properties}
        spaces={state.data.spaces}
        cancelTo={propertyId ? `/properties/${propertyId}` : '/units'}
        onSubmit={save}
      />
    </>
  )
}

export function EditSpacePage() {
  const { id = '' } = useParams()
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const getDataLayer = useDataLayer()
  const state = useSpaceData()
  const properties = useSortedProperties(state.status === 'success' ? state.data.properties : undefined)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') {
    return <ErrorState message={t('spaces.loadError')} onRetry={state.reload} />
  }

  const context = getSpaceEditContext(state.data, id, toIsoDate(new Date()))
  if (!context) {
    return (
      <EmptyState
        headingLevel="h1"
        icon={LayoutGridIcon}
        title={t('spaces.notFound.title')}
        description={t('spaces.notFound.description')}
      >
        <Link to="/units" className="button button--secondary">
          {t('spaces.notFound.back')}
        </Link>
      </EmptyState>
    )
  }
  const { space, activeLease, tenant, deletion } = context

  const save = async (values: SpaceFormValues) => {
    const updated = await updateSpace(getDataLayer(), space.id, values)
    navigate(`/units?property=${updated.propertyId}`, {
      state: flashState(t('spaces.flash.updated', { name: updated.name })),
    })
  }

  return (
    <>
      <PageHeader
        title={t('spaces.form.editTitle')}
        description={t('spaces.form.editDescription', { name: space.name })}
      />
      <SpaceForm
        initialValues={toSpaceForm(space, locale)}
        properties={properties}
        spaces={state.data.spaces}
        editingId={space.id}
        lockedStatus={activeLease ? { tenant, since: activeLease.startDate } : undefined}
        cancelTo={`/units?property=${space.propertyId}`}
        onSubmit={save}
      />

      <section className="card danger-zone" aria-labelledby="space-delete-title">
        <div>
          <h2 id="space-delete-title" className="danger-zone__title">
            {t('spaces.delete.sectionTitle')}
          </h2>
          <p className="danger-zone__description">{t('spaces.delete.sectionDescription')}</p>
        </div>
        <button
          type="button"
          className="button button--secondary button--danger-text"
          onClick={() => setDeleteOpen(true)}
        >
          <TrashIcon width={16} height={16} />
          {t('spaces.delete.button')}
        </button>
      </section>

      <DeleteSpaceDialog
        open={deleteOpen}
        space={space}
        deletion={deletion}
        onClose={() => setDeleteOpen(false)}
        onBlocked={state.reload}
      />
    </>
  )
}
