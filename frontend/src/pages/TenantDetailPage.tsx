import { Link, useParams } from 'react-router'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { UsersIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'

export function TenantDetailPage() {
  const { id } = useParams()

  return (
    <>
      <PageHeader title="Tenant details" description={`Reference: ${id ?? 'unknown'}`} />
      <EmptyState
        icon={UsersIcon}
        title="Tenant details are coming soon"
        description="Detailed information will be shown here once data is connected."
      >
        <Link to="/tenants" className="button button--secondary">
          Back to tenants
        </Link>
      </EmptyState>
    </>
  )
}
