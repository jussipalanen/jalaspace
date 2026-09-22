import { EmptyState } from '../components/EmptyState/EmptyState'
import { SettingsIcon } from '../components/icons'
import { PageHeader } from '../components/PageHeader/PageHeader'

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Application and demo environment settings."
      />
      <EmptyState
        icon={SettingsIcon}
        title="Settings are coming soon"
        description="Demo data reset and other preferences will be available here."
      />
    </>
  )
}
