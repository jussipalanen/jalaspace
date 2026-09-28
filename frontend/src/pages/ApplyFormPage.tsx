import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState, LoadingState } from '../components/DataState/DataState'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { BuildingIcon, CheckCircleIcon, ChevronLeftIcon, MapPinIcon } from '../components/icons'
import { LocationMap } from '../components/LocationMap/LazyLocationMap'
import { isSharedData } from '../config/dataProvider'
import { ApplicationForm } from '../features/apply/ApplicationForm'
import { SpaceFacts, SpaceFeatureChips } from '../features/apply/SpaceFacts'
import { useOpenSpaces } from '../features/apply/useOpenSpaces'
import { useDataLayer } from '../hooks/useDataLayer'
import { useTranslation } from '../i18n/useTranslation'
import type { OpenSpace } from '../services/applications'
import { createApplication, SpaceUnavailableError } from '../services/applicationService'
import './ApplyFormPage.css'

/** Public page: the application form for one space. */
export function ApplyFormPage() {
  const { spaceId = '' } = useParams()
  const { t } = useTranslation()
  const state = useOpenSpaces()

  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') return <ErrorState message={t('apply.list.loadError')} onRetry={state.reload} />

  const item = state.data.find(({ space }) => space.id === spaceId)
  if (!item) return <SpaceUnavailable />
  return <ApplyForSpace key={item.space.id} item={item} />
}

function ApplyForSpace({ item }: { item: OpenSpace }) {
  const { t } = useTranslation()
  const getDataLayer = useDataLayer()
  const [outcome, setOutcome] = useState<'form' | 'sent' | 'unavailable'>('form')
  const { space, property } = item

  const send = async (values: Parameters<typeof createApplication>[2]) => {
    try {
      await createApplication(getDataLayer(), space.id, values)
      setOutcome('sent')
    } catch (error) {
      // The space was let or reserved while the form was open.
      if (error instanceof SpaceUnavailableError) setOutcome('unavailable')
      else throw error
    }
  }

  if (outcome === 'sent') return <ApplicationSent item={item} />
  if (outcome === 'unavailable') return <SpaceUnavailable />

  return (
    <>
      <Link to="/apply" className="apply-back">
        <ChevronLeftIcon width={16} height={16} />
        {t('apply.form.back')}
      </Link>
      <div className="apply-form-page__heading">
        <h1 className="apply-form-page__title">{t('apply.form.title', { space: space.name })}</h1>
        <p className="apply-form-page__intro">{t('apply.form.intro')}</p>
      </div>

      <div className="apply-form-page">
        <aside className="card apply-summary" aria-labelledby="apply-summary-title">
          <h2 id="apply-summary-title" className="apply-summary__title">
            {space.name}
            <span className="apply-summary__type">{t(`space.type.${space.type}`)}</span>
          </h2>
          <p className="apply-summary__property">
            <BuildingIcon width={18} height={18} />
            <span>
              <strong>{property.name}</strong>
              <span className="apply-summary__address">
                {property.address}, {property.postalCode} {property.city}
              </span>
            </span>
          </p>
          <SpaceFacts space={space} />
          <SpaceFeatureChips space={space} />
          {property.location ? (
            <LocationMap
              location={property.location}
              zoom={property.location.zoom}
              label={t('apply.summary.mapLabel', { name: property.name })}
            />
          ) : (
            <p className="apply-summary__no-map">
              <MapPinIcon width={16} height={16} />
              {property.city}
            </p>
          )}
        </aside>

        <ApplicationForm onSubmit={send} />
      </div>
    </>
  )
}

function ApplicationSent({ item: { space, property } }: { item: OpenSpace }) {
  const { t } = useTranslation()
  const heading = useRef<HTMLHeadingElement>(null)

  // Move focus to the result, so keyboard and screen reader users hear it.
  useEffect(() => heading.current?.focus(), [])

  return (
    <section className="card apply-sent" aria-labelledby="apply-sent-title">
      <CheckCircleIcon className="apply-sent__icon" width={48} height={48} />
      <h1 id="apply-sent-title" ref={heading} tabIndex={-1} className="apply-sent__title">
        {t('apply.sent.title')}
      </h1>
      <p>{t('apply.sent.description', { space: space.name, property: property.name })}</p>
      {!isSharedData() && <p className="apply-sent__note">{t('apply.sent.demoNote')}</p>}
      <Link to="/apply" className="button button--primary">
        {t('apply.sent.browse')}
      </Link>
    </section>
  )
}

function SpaceUnavailable() {
  const { t } = useTranslation()
  return (
    <EmptyState
      headingLevel="h1"
      icon={BuildingIcon}
      title={t('apply.unavailable.title')}
      description={t('apply.unavailable.description')}
    >
      <Link to="/apply" className="button button--primary">
        {t('apply.unavailable.back')}
      </Link>
    </EmptyState>
  )
}
