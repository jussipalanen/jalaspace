import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
    >
      <Link to="/" className="button button--primary">
        Go to dashboard
      </Link>
    </EmptyState>
  )
}
