import './ChartLegend.css'

export interface ChartLegendItem {
  key: string
  label: string
  value: string
  /** The colour of the chart segment; the text keeps the text colours. */
  color: string
}

/** The names and values of a chart's segments, so they are never told apart by colour alone. */
export function ChartLegend({ items }: { items: ChartLegendItem[] }) {
  return (
    <ul className="chart-legend">
      {items.map((item) => (
        <li key={item.key} className="chart-legend__item">
          <span className="chart-legend__swatch" style={{ background: item.color }} aria-hidden="true" />
          {/* Spaces keep the words apart in the card link's accessible name. */}
          <span className="chart-legend__label">{item.label}</span>{' '}
          <span className="chart-legend__value">{item.value}</span>{' '}
        </li>
      ))}
    </ul>
  )
}
