import { WrenchIcon } from '../components/icons'
import { DetailPlaceholder } from './placeholders'

export function MaintenanceDetailPage() {
  return <DetailPlaceholder section="maintenanceDetails" icon={WrenchIcon} backTo="/maintenance" />
}
