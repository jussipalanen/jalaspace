import { useEffect, useId, useRef, useState } from 'react'
import { SparklesIcon } from '../../components/icons'
import { useTranslation } from '../../i18n/useTranslation'
import {
  requestMaintenanceSuggestion,
  SUGGESTION_DESCRIPTION_MAX_LENGTH,
  SuggestionRequestError,
  type MaintenanceSuggestion as Suggestion,
  type SuggestionErrorCode,
} from '../../services/maintenanceSuggestions'
import { MAINTENANCE_TITLE_MAX_LENGTH } from '../../services/maintenance'
import { useSuggestionsAvailable } from './useSuggestionsAvailable'
import './MaintenanceSuggestion.css'

interface MaintenanceSuggestionProps {
  /** The form's title and description; either one is enough for a suggestion. */
  title: string
  description: string
  /** Fills the form with the suggestion; the user still reviews and saves. */
  onApply: (suggestion: Suggestion) => void
}

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'suggested'; suggestion: Suggestion }
  | { kind: 'error'; code: SuggestionErrorCode }

/**
 * "Suggest with AI" for the maintenance form: the title and description are sent
 * to the API, which asks Gemini for a title, a description with things to check,
 * a category and a priority. The suggestion is only shown; the user decides whether to apply it.
 */
export function MaintenanceSuggestion({ title, description, onApply }: MaintenanceSuggestionProps) {
  const { t, language } = useTranslation()
  const { apiUrl, available } = useSuggestionsAvailable()
  const [state, setState] = useState<State>({ kind: 'idle' })
  const controller = useRef<AbortController | null>(null)
  const hintId = useId()
  const headingId = useId()

  // Cancel a pending request when the form closes.
  useEffect(() => () => controller.current?.abort(), [])

  if (!apiUrl || !available) return null

  const suggest = async () => {
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setState({ kind: 'loading' })
    try {
      const suggestion = await requestMaintenanceSuggestion(
        apiUrl,
        { title, description },
        language,
        request.signal,
      )
      setState({ kind: 'suggested', suggestion })
    } catch (error) {
      if (request.signal.aborted) return
      setState({
        kind: 'error',
        code: error instanceof SuggestionRequestError ? error.code : 'unavailable',
      })
    }
  }

  const loading = state.kind === 'loading'

  return (
    <div className="maintenance-suggestion">
      <div className="maintenance-suggestion__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={suggest}
          disabled={loading || (!title.trim() && !description.trim())}
          aria-describedby={hintId}
        >
          <SparklesIcon width={16} height={16} />
          {loading ? t('maintenance.suggestion.loading') : t('maintenance.suggestion.button')}
        </button>
      </div>
      <p id={hintId} className="field__hint">
        {loading ? t('maintenance.suggestion.slowHint') : t('maintenance.suggestion.hint')}
      </p>

      <div role="status">
        {state.kind === 'error' && (
          <p className="alert alert--error maintenance-suggestion__error">
            {t(`maintenance.suggestion.errors.${state.code}`, {
              max:
                state.code === 'titleTooLong'
                  ? MAINTENANCE_TITLE_MAX_LENGTH
                  : SUGGESTION_DESCRIPTION_MAX_LENGTH,
            })}
          </p>
        )}
        {state.kind === 'suggested' && (
          <section className="maintenance-suggestion__card" aria-labelledby={headingId}>
            <h3 id={headingId} className="maintenance-suggestion__title">
              <SparklesIcon width={16} height={16} />
              {t('maintenance.suggestion.title')}
            </h3>
            <dl className="maintenance-suggestion__details">
              <div>
                <dt>{t('maintenance.form.fields.title')}</dt>
                <dd>{state.suggestion.title}</dd>
              </div>
              <div>
                <dt>{t('maintenance.form.fields.category')}</dt>
                <dd>{t(`maintenance.category.${state.suggestion.category}`)}</dd>
              </div>
              <div>
                <dt>{t('maintenance.form.fields.priority')}</dt>
                <dd>{t(`maintenance.priority.${state.suggestion.priority}`)}</dd>
              </div>
              <div className="maintenance-suggestion__description">
                <dt>{t('maintenance.form.fields.description')}</dt>
                <dd>{state.suggestion.description}</dd>
              </div>
            </dl>
            <p className="maintenance-suggestion__review">{t('maintenance.suggestion.review')}</p>
            <div className="maintenance-suggestion__buttons">
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  onApply(state.suggestion)
                  setState({ kind: 'idle' })
                }}
              >
                {t('maintenance.suggestion.apply')}
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setState({ kind: 'idle' })}
              >
                {t('maintenance.suggestion.dismiss')}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
