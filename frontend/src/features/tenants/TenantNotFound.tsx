import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { UsersIcon } from '../../components/icons'
import { useTranslation } from '../../i18n/useTranslation'

export function TenantNotFound() {
  const { t } = useTranslation()
  return (
    <EmptyState
      headingLevel="h1"
      icon={UsersIcon}
      title={t('tenants.notFound.title')}
      description={t('tenants.notFound.description')}
    >
      <Link to="/tenants" className="button button--secondary">
        {t('tenants.notFound.back')}
      </Link>
    </EmptyState>
  )
}
