import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { FileTextIcon } from '../../components/icons'
import { useTranslation } from '../../i18n/useTranslation'

export function LeaseNotFound() {
  const { t } = useTranslation()
  return (
    <EmptyState
      headingLevel="h1"
      icon={FileTextIcon}
      title={t('leases.notFound.title')}
      description={t('leases.notFound.description')}
    >
      <Link to="/leases" className="button button--secondary">
        {t('leases.notFound.back')}
      </Link>
    </EmptyState>
  )
}
