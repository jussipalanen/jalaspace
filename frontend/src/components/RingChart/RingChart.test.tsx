import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RingChart } from './RingChart'

const circumference = 2 * Math.PI * ((64 - 8) / 2)
const arcs = (container: HTMLElement) => [...container.querySelectorAll('circle.ring-chart__segment')]
const dash = (arc: Element) => Number(arc.getAttribute('stroke-dasharray')?.split(' ')[0])

describe('RingChart', () => {
  it('draws one arc per non-empty segment, in proportion, with a gap between them', () => {
    const { container } = render(
      <RingChart
        segments={[
          { key: 'a', value: 3, color: 'red' },
          { key: 'empty', value: 0, color: 'green' },
          { key: 'b', value: 1, color: 'blue' },
        ]}
      />,
    )

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    const [a, b] = arcs(container)
    expect(arcs(container)).toHaveLength(2)
    expect(dash(a!)).toBeCloseTo(circumference * 0.75 - 2)
    expect(dash(b!)).toBeCloseTo(circumference * 0.25 - 2)
    // The second arc starts where the first one's share ends.
    expect(Number(b!.getAttribute('stroke-dashoffset'))).toBeCloseTo(-circumference * 0.75)
  })

  it('is a meter when the total is larger than the segment, without a gap', () => {
    const { container } = render(
      <RingChart segments={[{ key: 'occupied', value: 58, color: 'blue' }]} total={68} track="lightblue" />,
    )

    expect(dash(arcs(container)[0]!)).toBeCloseTo((58 / 68) * circumference)
    expect(container.querySelector('circle:not(.ring-chart__segment)')).toHaveAttribute('stroke', 'lightblue')
  })

  it('shows only the track when there is nothing to show', () => {
    const { container } = render(<RingChart segments={[{ key: 'a', value: 0, color: 'red' }]} total={0} />)

    expect(arcs(container)).toHaveLength(0)
    expect(container.querySelectorAll('circle')).toHaveLength(1)
  })
})
