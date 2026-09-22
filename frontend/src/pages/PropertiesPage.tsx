import { EmptyState } from '../components/EmptyState/EmptyState'
import { BuildingIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'

export function PropertiesPage() {
  return (
    <>
      <PageHeader
        title="Properties"
        description="Buildings and sites in your portfolio."
      />
      <EmptyState
        icon={BuildingIcon}
        title="Property management is coming soon"
        description="You will be able to add, search and manage properties here."
      />
    </>
  )
}
