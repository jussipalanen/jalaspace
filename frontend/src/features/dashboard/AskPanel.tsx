import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { SLOW_LOADING_MS } from '../../components/DataState/DataState'
import { CloseIcon, SparklesIcon } from '../../components/icons'
import { useApiFeature } from '../../hooks/useApiFeature'
import { formatArea, formatCurrency, formatPercent } from '../../i18n/format'
import { useTranslation } from '../../i18n/useTranslation'
import {
  ASK_QUESTION_MAX_LENGTH,
  AskRequestError,
  PLACE_PATHS,
  requestAskAnswer,
  type AskAnswer,
  type AskErrorCode,
  type AskSearch,
} from '../../services/ask'
import { listPageLink, runAskSearch, type AskResults } from '../../services/askSearch'
import type { DashboardInput } from '../../services/dashboard'
import { toIsoDate } from '../../utils/date'
import { formatDate } from '../../utils/format'
import { describeCondition, describeSort, PLACE_LABELS } from './askConditions'
import { MetaLine } from './DashboardPanel'
import './AskPanel.css'

/** Results shown before "Show all". */
const PREVIEW_COUNT = 5

type State =
  | { kind: 'idle' }
  | { kind: 'waiting' }
  | { kind: 'error'; code: AskErrorCode }
  | { kind: 'answered'; answer: AskAnswer }

/**
 * "Ask JalaSpace" on the Dashboard: the question goes to the API, whose AI
 * turns it into a place in the app or a search filter. The app then searches
 * its own data, so every result is a real record; the AI never sees the data.
 */
export function AskPanel({ data }: { data: DashboardInput }) {
  const { t, locale } = useTranslation()
  const { apiUrl, available } = useApiFeature('ask')
  const [question, setQuestion] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [slow, setSlow] = useState(false)
  /** Counts the answers, so a new one resets the result list. */
  const [answeredAt, setAnsweredAt] = useState(0)
  const controller = useRef<AbortController | null>(null)
  const titleId = useId()
  const inputId = useId()
  const privacyId = useId()

  const search = state.kind === 'answered' && state.answer.kind === 'search' ? state.answer : null
  // The app's own data, searched with the AI's filter; recalculated when a condition is removed.
  const results = useMemo(
    () => (search ? runAskSearch(data, search, toIsoDate(new Date()), locale) : null),
    [data, search, locale],
  )

  // Cancel a pending request when the Dashboard closes.
  useEffect(() => () => controller.current?.abort(), [])

  // A slow answer usually means the API is waking up.
  useEffect(() => {
    if (state.kind !== 'waiting') return
    const timer = setTimeout(() => setSlow(true), SLOW_LOADING_MS)
    return () => {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [state.kind])

  if (!apiUrl || !available) return null

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setState({ kind: 'waiting' })
    try {
      const answer = await requestAskAnswer(apiUrl, question, toIsoDate(new Date()), request.signal)
      setState({ kind: 'answered', answer })
      setAnsweredAt((count) => count + 1)
    } catch (error) {
      if (request.signal.aborted) return
      setState({ kind: 'error', code: error instanceof AskRequestError ? error.code : 'unavailable' })
    }
  }

  const waiting = state.kind === 'waiting'
  const answer = state.kind === 'answered' ? state.answer : null

  return (
    <section className="card ask-panel" aria-labelledby={titleId}>
      <h2 id={titleId} className="ask-panel__title">
        <SparklesIcon width={18} height={18} />
        {t('dashboard.ask.title')}
      </h2>
      <p className="ask-panel__description">{t('dashboard.ask.description')}</p>

      <form className="ask-panel__form" role="search" aria-labelledby={titleId} onSubmit={ask}>
        <label htmlFor={inputId} className="field__label">
          {t('dashboard.ask.label')}
        </label>
        <div className="ask-panel__row">
          <input
            id={inputId}
            className="field__input"
            value={question}
            placeholder={t('dashboard.ask.placeholder')}
            aria-describedby={privacyId}
            autoComplete="off"
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button type="submit" className="button button--primary" disabled={waiting}>
            {t('dashboard.ask.submit')}
          </button>
        </div>
        <p id={privacyId} className="field__hint">
          {t('dashboard.ask.privacy')}
        </p>
      </form>

      {/* Always rendered, so screen readers announce the changes in its status line. */}
      <div className="ask-panel__output" hidden={state.kind === 'idle'}>
        <div role="status" className="ask-panel__status">
          {waiting && (
            <>
              <p>{t('dashboard.ask.waiting')}</p>
              {slow && <p className="field__hint">{t('states.wakingUp')}</p>}
            </>
          )}
          {answer?.kind === 'none' && <p>{t('dashboard.ask.none')}</p>}
          {answer?.kind === 'navigate' && (
            <p>
              {t('dashboard.ask.navigate')}{' '}
              {answer.place === 'apiDocs' ? (
                <a href={`${apiUrl}${PLACE_PATHS.apiDocs}`} target="_blank" rel="noreferrer">
                  {t(PLACE_LABELS.apiDocs)}
                  <span className="visually-hidden"> {t('nav.opensInNewTab')}</span>
                </a>
              ) : (
                <Link to={PLACE_PATHS[answer.place]}>{t(PLACE_LABELS[answer.place])}</Link>
              )}
            </p>
          )}
          {answer?.kind === 'search' && results && (
            <p>{t(`dashboard.ask.results.${answer.area}`, { count: results.rows.length })}</p>
          )}
        </div>
        {state.kind === 'error' && (
          <p className="alert alert--error ask-panel__error" role="alert">
            {t(`dashboard.ask.errors.${state.code}`, { max: ASK_QUESTION_MAX_LENGTH })}
          </p>
        )}
        {answer?.kind === 'search' && results && (
          <AskSearchOutput
            // A new question starts with the preview again.
            key={answeredAt}
            search={answer}
            results={results}
            onChange={(search) => setState({ kind: 'answered', answer: search })}
          />
        )}
      </div>
    </section>
  )
}

interface AskSearchOutputProps {
  search: AskSearch
  results: AskResults
  /** Called with the search after the user removes a condition. */
  onChange: (search: AskSearch) => void
}

/** How the question was understood and the matches, with links to them. */
function AskSearchOutput({ search, results, onChange }: AskSearchOutputProps) {
  const { t, locale } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const conditions = Object.entries(search.filter)
  const listLink = listPageLink(search)
  const count = results.rows.length

  const removeCondition = (field: string) => {
    const filter = { ...search.filter }
    delete filter[field]
    onChange({ ...search, filter })
  }

  const removeSort = () => {
    const { sort: _sort, ...rest } = search
    onChange(rest)
  }

  const chips = [
    ...conditions.map(([field, value]) => ({
      key: field,
      label: describeCondition(t, locale, search.area, field, value),
      remove: () => removeCondition(field),
    })),
    ...(search.sort ? [{ key: 'sort', label: describeSort(t, search.sort), remove: removeSort }] : []),
  ]

  return (
    <>
      <div className="ask-panel__understood">
        <span className="ask-panel__understood-label">{t('dashboard.ask.understood')}:</span>
        <ul className="ask-panel__conditions">
          {chips.length === 0 && (
            <li className="ask-panel__condition">
              {t('dashboard.ask.everything', { area: t(`dashboard.ask.areas.${search.area}`) })}
            </li>
          )}
          {chips.map((chip) => (
            <li key={chip.key} className="ask-panel__condition">
              {chip.label}
              <button
                type="button"
                className="ask-panel__remove"
                aria-label={t('dashboard.ask.removeCondition', { condition: chip.label })}
                onClick={chip.remove}
              >
                <CloseIcon width={14} height={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>
      {search.ignored.length > 0 && (
        <p className="field__hint">{t('dashboard.ask.ignored', { words: search.ignored.join(', ') })}</p>
      )}

      {count === 0 ? (
        <p className="ask-panel__empty">{t('dashboard.ask.noResults')}</p>
      ) : (
        <AskResultList results={results} limit={expanded ? count : PREVIEW_COUNT} />
      )}

      {((count > PREVIEW_COUNT && !expanded) || listLink) && (
        <div className="ask-panel__actions">
          {count > PREVIEW_COUNT && !expanded && (
            <button type="button" className="button button--secondary" onClick={() => setExpanded(true)}>
              {t('dashboard.ask.showAll', { count })}
            </button>
          )}
          {listLink && (
            <Link to={listLink} className="ask-panel__list-link">
              {t('dashboard.ask.openList', { page: t(PLACE_LABELS[search.area]) })}
            </Link>
          )}
        </div>
      )}
    </>
  )
}

/** The first `limit` matches, each linking to its page. */
function AskResultList({ results, limit }: { results: AskResults; limit: number }) {
  const { t, locale } = useTranslation()

  const items = ((): { key: string; to: string; title: string; meta: (string | null | undefined)[] }[] => {
    switch (results.area) {
      case 'properties':
        return results.rows.map((row) => ({
          key: row.property.id,
          to: `/properties/${row.property.id}`,
          title: row.property.name,
          meta: [
            row.property.city,
            t('spaces.resultCount', { count: row.spaceCount }),
            row.occupancyPercent === null ? null : formatPercent(row.occupancyPercent, locale),
          ],
        }))
      case 'spaces':
        return results.rows.map(({ space, property }) => ({
          key: space.id,
          to: `/units/${space.id}/edit`,
          title: space.name,
          meta: [
            property?.name,
            t(`space.type.${space.type}`),
            formatArea(space.areaM2, locale),
            space.rooms === null ? null : t('dashboard.ask.rooms', { count: space.rooms }),
            ...space.features.map((feature) => t(`space.feature.${feature}`)),
            t(`space.status.${space.status}`),
          ],
        }))
      case 'tenants':
        return results.rows.map(({ tenant, properties }) => ({
          key: tenant.id,
          to: `/tenants/${tenant.id}`,
          title: tenant.name,
          meta: [t(`tenant.type.${tenant.type}`), tenant.email, ...properties.map((property) => property.name)],
        }))
      case 'leases':
        return results.rows.map(({ lease, status, tenant, space, property }) => ({
          key: lease.id,
          to: `/leases/${lease.id}/edit`,
          title: [tenant?.name, space?.name].filter(Boolean).join(' · '),
          meta: [
            property?.name,
            lease.endDate
              ? t('dashboard.ask.period', { start: formatDate(lease.startDate), end: formatDate(lease.endDate) })
              : t('dashboard.ask.openEnded', { start: formatDate(lease.startDate) }),
            t(`lease.status.${status}`),
            lease.monthlyRentCents === null ? null : formatCurrency(lease.monthlyRentCents, locale),
          ],
        }))
      case 'maintenance':
        return results.rows.map(({ task, property, space }) => ({
          key: task.id,
          to: `/maintenance/${task.id}`,
          title: task.title,
          meta: [
            property?.name,
            space?.name,
            t(`maintenance.priority.${task.priority}`),
            t(`maintenance.status.${task.status}`),
            task.dueDate ? t('dashboard.ask.due', { date: formatDate(task.dueDate) }) : null,
          ],
        }))
    }
  })()

  return (
    <ul className="dashboard-list ask-panel__results">
      {items.slice(0, limit).map((item) => (
        <li key={item.key} className="dashboard-list__item">
          <div className="dashboard-list__main">
            <Link to={item.to} className="dashboard-list__title">
              {item.title}
            </Link>
            <MetaLine parts={item.meta} />
          </div>
        </li>
      ))}
    </ul>
  )
}
