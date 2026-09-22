import { Link, useParams } from 'react-router'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { WrenchIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'

export function MaintenanceDetailPage() {
  const { id } = useParams()

  return (
    <>
      <PageHeader title="Maintenance task details" description={`Reference: ${id ?? 'unknown'}`} />
      <EmptyState
        icon={WrenchIcon}
        title="Maintenance task details are coming soon"
        description="Detailed information will be shown here once data is connected."
      >
        <Link to="/maintenance" className="button button--secondary">
          Back to maintenance
        </Link>
      </EmptyState>
    </>
  )
}
