import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { WrenchIcon } from '../../components/icons'
import { useTranslation } from '../../i18n/useTranslation'

export function MaintenanceNotFound() {
  const { t } = useTranslation()
  return (
    <EmptyState
      headingLevel="h1"
      icon={WrenchIcon}
      title={t('maintenance.notFound.title')}
      description={t('maintenance.notFound.description')}
    >
      <Link to="/maintenance" className="button button--secondary">
        {t('maintenance.notFound.back')}
      </Link>
    </EmptyState>
  )
}
