import { Link, useParams } from 'react-router'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { useTranslation } from '../i18n/useTranslation'
import type { IconComponent } from '../types/navigation'

type Section = 'tenants' | 'leases'

/** Temporary page for sections whose features are not built yet. */
export function SectionPlaceholder({ section, icon }: { section: Section; icon: IconComponent }) {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader
        title={t(`pages.${section}.title`)}
        description={t(`pages.${section}.description`)}
      />
      <EmptyState
        icon={icon}
        title={t(`pages.${section}.comingSoonTitle`)}
        description={t(`pages.${section}.comingSoonDescription`)}
      />
    </>
  )
}

type DetailSection = 'tenantDetails'

/** Temporary detail page that shows the requested id. */
export function DetailPlaceholder({
  section,
  icon,
  backTo,
}: {
  section: DetailSection
  icon: IconComponent
  backTo: string
}) {
  const { t } = useTranslation()
  const { id } = useParams()
  return (
    <>
      <PageHeader
        title={t(`pages.${section}.title`)}
        description={t('pages.details.reference', { id: id ?? '' })}
      />
      <EmptyState
        icon={icon}
        title={t(`pages.${section}.comingSoonTitle`)}
        description={t('pages.details.comingSoonDescription')}
      >
        <Link to={backTo} className="button button--secondary">
          {t(`pages.${section}.back`)}
        </Link>
      </EmptyState>
    </>
  )
}
