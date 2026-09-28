import type { CSSProperties } from 'react'
import './RingChart.css'

export interface RingSegment {
  key: string
  value: number
  /** A CSS colour, e.g. `var(--color-chart-occupied)`. */
  color: string
}

interface RingChartProps {
  segments: RingSegment[]
  /**
   * The whole ring; defaults to the sum of the segments. A larger total leaves
   * the rest of the ring as the track, which makes a single segment a meter.
   */
  total?: number
  /** Colour of the unfilled track. */
  track?: string
  size?: number
  thickness?: number
}

/** Surface gap between neighbouring segments, in pixels along the ring. */
const GAP = 2

/**
 * A small ring (donut) chart for a part-to-whole view at a glance, or a meter
 * with one segment. Decorative for screen readers: the text next to it states
 * the same numbers. The segments grow from the top when the ring first
 * appears, unless the user prefers reduced motion.
 */
export function RingChart({
  segments,
  total,
  track = 'var(--color-border)',
  size = 64,
  thickness = 8,
}: RingChartProps) {
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const visible = segments.filter((segment) => segment.value > 0)
  const whole = total ?? visible.reduce((sum, segment) => sum + segment.value, 0)
  // Gaps only separate segments; a single segment or a meter's fill has none.
  const gap = visible.length > 1 ? GAP : 0

  let offset = 0
  const arcs =
    whole > 0
      ? visible.map((segment) => {
          const length = (Math.min(segment.value, whole) / whole) * circumference
          const arc = { ...segment, length: Math.max(length - gap, 0.5), offset }
          offset += length
          return arc
        })
      : []

  return (
    <svg
      className="ring-chart"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
      style={{ '--ring-circumference': circumference } as CSSProperties}
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={thickness}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={track} />
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            className="ring-chart__segment"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={arc.color}
            strokeDasharray={`${arc.length} ${circumference}`}
            strokeDashoffset={-arc.offset}
          />
        ))}
      </g>
    </svg>
  )
}
