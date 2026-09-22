import { UsersIcon } from '../components/icons'
import { DetailPlaceholder } from './placeholders'

export function TenantDetailPage() {
  return <DetailPlaceholder section="tenantDetails" icon={UsersIcon} backTo="/tenants" />
}
