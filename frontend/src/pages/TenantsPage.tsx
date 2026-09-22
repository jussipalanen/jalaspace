import { EmptyState } from '../components/EmptyState/EmptyState'
import { UsersIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'

export function TenantsPage() {
  return (
    <>
      <PageHeader
        title="Tenants"
        description="Companies and people renting your spaces."
      />
      <EmptyState
        icon={UsersIcon}
        title="Tenant management is coming soon"
        description="You will be able to manage tenants and assign them to spaces here."
      />
    </>
  )
}
