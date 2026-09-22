import { EmptyState } from '../components/EmptyState/EmptyState'
import { FileTextIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'

export function LeasesPage() {
  return (
    <>
      <PageHeader
        title="Leases"
        description="Lease agreements between tenants and spaces."
      />
      <EmptyState
        icon={FileTextIcon}
        title="Lease management is coming soon"
        description="You will be able to manage lease periods, rents and statuses here."
      />
    </>
  )
}
