import { EmptyState } from '../components/EmptyState/EmptyState'
import { WrenchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'

export function MaintenancePage() {
  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Track and resolve maintenance tasks across your properties."
      />
      <EmptyState
        icon={WrenchIcon}
        title="Maintenance tasks are coming soon"
        description="You will be able to create, prioritise and complete maintenance tasks here."
      />
    </>
  )
}
