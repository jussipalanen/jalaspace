import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { useTranslation } from '../i18n/useTranslation'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <EmptyState title={t('pages.notFound.title')} description={t('pages.notFound.description')}>
      <Link to="/" className="button button--primary">
        {t('pages.notFound.action')}
      </Link>
    </EmptyState>
  )
}
