import { Link, useParams } from 'react-router'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { BuildingIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'

export function PropertyDetailPage() {
  const { id } = useParams()

  return (
    <>
      <PageHeader title="Property details" description={`Reference: ${id ?? 'unknown'}`} />
      <EmptyState
        icon={BuildingIcon}
        title="Property details are coming soon"
        description="Detailed information will be shown here once data is connected."
      >
        <Link to="/properties" className="button button--secondary">
          Back to properties
        </Link>
      </EmptyState>
    </>
  )
}
