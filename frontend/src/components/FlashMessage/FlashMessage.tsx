import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from '../../i18n/useTranslation'
import { CloseIcon } from '../icons'
import { readFlash, type Flash } from './flash'
import './FlashMessage.css'

interface ShownFlash extends Flash {
  key: string
  pathname: string
}

/**
 * Shows the success message passed in navigation state. The state is removed
 * from history right away, so reloading the page does not show it again; the
 * message stays until dismissed or until the user navigates elsewhere.
 */
export function FlashMessage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const incoming = readFlash(location.state)
  const [shown, setShown] = useState<ShownFlash | null>(null)

  // Adjust state during render when the location changes (no effect needed).
  if (incoming && shown?.key !== location.key) {
    setShown({ ...incoming, key: location.key, pathname: location.pathname })
  } else if (!incoming && shown && shown.pathname !== location.pathname) {
    setShown(null)
  }

  useEffect(() => {
    if (incoming) {
      navigate(`${location.pathname}${location.search}${location.hash}`, {
        replace: true,
        state: null,
      })
    }
  }, [incoming, location.pathname, location.search, location.hash, navigate])

  if (!shown) return null

  return (
    <div className="flash-message" role="status">
      <p className="flash-message__text">{shown.message}</p>
      <button
        type="button"
        className="icon-button flash-message__dismiss"
        onClick={() => setShown(null)}
        aria-label={t('common.dismiss')}
      >
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  )
}
