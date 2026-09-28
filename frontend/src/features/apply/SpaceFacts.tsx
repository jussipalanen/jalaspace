import { AreaIcon, DoorIcon, LayersIcon } from '../../components/icons'
import { formatArea } from '../../i18n/format'
import { useTranslation } from '../../i18n/useTranslation'
import type { Space } from '../../types/space'
import './SpaceFacts.css'

/** Area, rooms and floor of a space, with icons. */
export function SpaceFacts({ space }: { space: Space }) {
  const { t, locale } = useTranslation()
  return (
    <ul className="space-facts" aria-label={t('apply.list.facts')}>
      <li>
        <AreaIcon width={18} height={18} />
        {formatArea(space.areaM2, locale)}
      </li>
      {space.rooms !== null && (
        <li>
          <DoorIcon width={18} height={18} />
          {t('apply.list.rooms', { count: space.rooms })}
        </li>
      )}
      <li>
        <LayersIcon width={18} height={18} />
        {t('apply.list.floor', { floor: space.floor })}
      </li>
    </ul>
  )
}

/** The features of a space as chips; nothing when it has none. */
export function SpaceFeatureChips({ space }: { space: Space }) {
  const { t } = useTranslation()
  if (space.features.length === 0) return null
  return (
    <ul className="space-features" aria-label={t('apply.summary.features')}>
      {space.features.map((feature) => (
        <li key={feature} className="space-features__chip">
          {t(`space.feature.${feature}`)}
        </li>
      ))}
    </ul>
  )
}
