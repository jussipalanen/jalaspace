import type { ReactNode } from 'react'
import type { Tone } from '../../utils/labels'
import './StatusBadge.css'

export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}
