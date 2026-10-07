import { useCallback, useMemo } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDataLayer } from '../../hooks/useDataLayer'
import { useToday } from '../../hooks/useToday'
import { useTranslation } from '../../i18n/useTranslation'
import { buildDashboardSummary, type DashboardInput } from '../../services/dashboard'

export function useDashboard() {
  const getDataLayer = useDataLayer()
  const { locale } = useTranslation()
  const today = useToday()

  const load = useCallback(async (): Promise<DashboardInput> => {
    const { properties, spaces, tenants, leases, maintenance, applications } = getDataLayer()
    const [propertyList, spaceList, tenantList, leaseList, taskList, applicationList] = await Promise.all([
      properties.getAll(),
      spaces.getAll(),
      tenants.getAll(),
      leases.getAll(),
      maintenance.getAll(),
      applications.getAll(),
    ])
    return {
      properties: propertyList,
      spaces: spaceList,
      tenants: tenantList,
      leases: leaseList,
      maintenance: taskList,
      applications: applicationList,
    }
  }, [getDataLayer])

  const state = useAsyncData(load)
  const data = state.status === 'success' ? state.data : null

  // Recalculated when the language changes (sorting), without reloading data.
  const summary = useMemo(
    () => (data ? buildDashboardSummary(data, today, locale) : null),
    [data, today, locale],
  )

  return { status: state.status, data, summary, reload: state.reload }
}
