import { useCallback, useMemo } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useTranslation } from '../../i18n/useTranslation'
import { buildDashboardSummary, type DashboardInput } from '../../services/dashboard'
import { toIsoDate } from '../../utils/date'

export function useDashboard() {
  const getDataLayer = useDataLayer()
  const { locale } = useTranslation()

  const load = useCallback(async (): Promise<DashboardInput> => {
    const { properties, spaces, tenants, leases, maintenance } = getDataLayer()
    const [propertyList, spaceList, tenantList, leaseList, taskList] = await Promise.all([
      properties.getAll(),
      spaces.getAll(),
      tenants.getAll(),
      leases.getAll(),
      maintenance.getAll(),
    ])
    return {
      properties: propertyList,
      spaces: spaceList,
      tenants: tenantList,
      leases: leaseList,
      maintenance: taskList,
    }
  }, [getDataLayer])

  const state = useAsyncData(load)
  const data = state.status === 'success' ? state.data : null

  // Recalculated when the language changes (sorting), without reloading data.
  const summary = useMemo(
    () => (data ? buildDashboardSummary(data, toIsoDate(new Date()), locale) : null),
    [data, locale],
  )

  return { status: state.status, data, summary, reload: state.reload }
}
