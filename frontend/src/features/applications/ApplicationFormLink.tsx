import { Link } from 'react-router'
import { ExternalLinkIcon } from '../../components/icons'
import { useTranslation } from '../../i18n/useTranslation'

interface ApplicationFormLinkProps {
  /** The space to apply for; without one, the list of available spaces. */
  space?: { id: string; name: string }
  className?: string
}

/**
 * Opens the public application form in a new tab, so the property manager
 * can see or share it without leaving the app.
 */
export function ApplicationFormLink({ space, className }: ApplicationFormLinkProps) {
  const { t } = useTranslation()
  const label = space ? t('applications.formLinkFor', { space: space.name }) : t('applications.formLink')
  return (
    <Link
      to={space ? `/apply/${space.id}` : '/apply'}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={`${label} ${t('nav.opensInNewTab')}`}
    >
      {t('applications.formLink')}
      <ExternalLinkIcon width={14} height={14} />
    </Link>
  )
}
