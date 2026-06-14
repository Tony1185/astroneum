import type { OverlayTemplate } from '@/types'

const measure: OverlayTemplate = {
  name: 'measure',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length < 2) return []

    const c1 = coordinates[0]
    const c2 = coordinates[1]
    const c3 = coordinates.length > 2 ? coordinates[2] : undefined

    const dx = Math.abs(c2.x - c1.x)
    const dy = Math.abs(c2.y - c1.y)
    const pixelDist = Math.sqrt(dx * dx + dy * dy)
    const labelX = c2.x > c1.x ? c2.x + 6 : c2.x - 80

    const figures: Array<{ type: string; attrs: unknown; ignoreEvent?: boolean }> = [
      {
        type: 'line',
        attrs: { coordinates: [c1, c2] },
      },
      {
        type: 'text',
        ignoreEvent: true,
        attrs: {
          x: labelX,
          y: c2.y + 4,
          text: `${pixelDist.toFixed(0)}px`,
          align: 'left' as const,
          baseline: 'top' as const,
        },
      },
    ]

    if (c3) {
      figures.push({
        type: 'line',
        attrs: { coordinates: [c1, c3] },
      })
    }

    return figures
  },
}

export default measure
