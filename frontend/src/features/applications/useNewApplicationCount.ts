import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useDataLayer } from '../../hooks/useDataLayer'
import { STORAGE_KEYS } from '../../repositories/localStorage/keys'
import { countNewApplications } from '../../services/applications'

/**
 * The number of new (submitted) applications, for the sidebar badge; `null`
 * while loading or when it cannot be loaded. Counted again after every
 * navigation, which includes the status changes on the application page, and
 * when another tab of this browser changes the stored applications.
 */
export function useNewApplicationCount(): number | null {
  const getDataLayer = useDataLayer()
  const location = useLocation()
  const [count, setCount] = useState<number | null>(null)
  const [changedElsewhere, setChangedElsewhere] = useState(0)

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.applications) setChangedElsewhere((value) => value + 1)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    let cancelled = false
    getDataLayer()
      .applications.getAll()
      .then(
        (applications) => {
          if (!cancelled) setCount(countNewApplications(applications))
        },
        // A badge is not worth an error message: hide it instead.
        () => {
          if (!cancelled) setCount(null)
        },
      )
    return () => {
      cancelled = true
    }
  }, [getDataLayer, location.key, changedElsewhere])

  return count
}
