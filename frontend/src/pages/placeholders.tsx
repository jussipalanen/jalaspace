import { EmptyState } from '../components/EmptyState/EmptyState'
import { PageHeader } from '../components/PageHeader/PageHeader'
import { useTranslation } from '../i18n/useTranslation'
import type { IconComponent } from '../types/navigation'

type Section = 'leases'

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
