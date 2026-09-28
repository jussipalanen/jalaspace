import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { InboxIcon } from '../../components/icons'
import { useTranslation } from '../../i18n/useTranslation'

export function ApplicationNotFound() {
  const { t } = useTranslation()
  return (
    <EmptyState
      headingLevel="h1"
      icon={InboxIcon}
      title={t('applications.notFound.title')}
      description={t('applications.notFound.description')}
    >
      <Link to="/applications" className="button button--secondary">
        {t('applications.notFound.back')}
      </Link>
    </EmptyState>
  )
}
