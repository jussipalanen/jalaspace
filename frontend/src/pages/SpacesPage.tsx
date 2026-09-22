import { EmptyState } from '../components/EmptyState/EmptyState'
import { LayoutGridIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'

export function SpacesPage() {
  return (
    <>
      <PageHeader
        title="Spaces"
        description="Units and rentable spaces across all properties."
      />
      <EmptyState
        icon={LayoutGridIcon}
        title="Space management is coming soon"
        description="You will be able to filter spaces by property and status, and track availability here."
      />
    </>
  )
}
