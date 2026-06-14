import type { CandleData, IndicatorPlugin, Viewport } from '@/types'

/**
 * Volume Profile indicator — horizontal histogram of volume at each price level.
 *
 * Usage:
 *   import { volumeProfilePlugin } from 'astroneum'
 *   registerIndicatorPlugin(volumeProfilePlugin)
 *   chart.createIndicator({ name: 'volume_profile' })
 *
 * Or set it as a sub-indicator:
 *   <AstroneumChart subIndicators={['VOL', 'volume_profile']} />
 */

export interface VolumeProfileRow {
  price: number
  volume: number
  /** Cumulative volume from top → this level */
  cumulative: number
}

function computeVolumeProfile(
  data: CandleData[],
  rowsCount = 30
): VolumeProfileRow[] {
  if (data.length === 0) return []

  // Find visible price range
  let priceHigh = -Infinity
  let priceLow = Infinity
  for (const bar of data) {
    const high = bar.high
    const low = bar.low
    if (high > priceHigh) priceHigh = high
    if (low < priceLow) priceLow = low
  }

  const priceRange = priceHigh - priceLow
  if (priceRange <= 0) return []

  const step = priceRange / rowsCount
  const buckets = new Array<number>(rowsCount).fill(0)

  // Assign volume to each price bucket
  for (const bar of data) {
    const vol = bar.volume ?? 0
    // Simple allocation: distribute volume uniformly across bar's HL range
    const barRange = bar.high - bar.low
    if (barRange <= 0) {
      const row = Math.floor((bar.close - priceLow) / step)
      if (row >= 0 && row < rowsCount) buckets[row] += vol
    } else {
      // Proportional distribution
      const volPerUnit = vol / barRange
      for (let i = 0; i < rowsCount; i++) {
        const levelLow = priceLow + i * step
        const levelHigh = levelLow + step
        // Overlap between bar range and level range
        const overlapLow = Math.max(bar.low, levelLow)
        const overlapHigh = Math.min(bar.high, levelHigh)
        if (overlapHigh > overlapLow) {
          buckets[i] += (overlapHigh - overlapLow) * volPerUnit
        }
      }
    }
  }

  // Build rows from low to high (bottom to top visually)
  const rows: VolumeProfileRow[] = []
  let cumulative = 0
  for (let i = 0; i < rowsCount; i++) {
    cumulative += buckets[i]
    rows.push({
      price: priceLow + i * step + step / 2,
      volume: buckets[i],
      cumulative,
    })
  }

  return rows
}

export const volumeProfilePlugin: IndicatorPlugin<VolumeProfileRow> = {
  name: 'volume_profile',
  shortName: 'VProfile',
  calcParams: [30], // default 30 rows/buckets

  calc(data: CandleData[], params: number[]): VolumeProfileRow[] {
    const rowsCount = Math.max(5, Math.min(100, Math.round(params[0] ?? 30)))
    return computeVolumeProfile(data, rowsCount)
  },

  render2D(
    ctx: CanvasRenderingContext2D,
    output: VolumeProfileRow[],
    viewport: Viewport
  ): void {
    if (output.length === 0) return

    const [width, height] = viewport.resolution
    const priceMin = viewport.priceMin as number
    const priceMax = viewport.priceMax as number
    const priceRange = priceMax - priceMin
    if (priceRange <= 0) return

    // Find max volume for scaling
    let maxVol = 0
    for (const row of output) maxVol = Math.max(maxVol, row.volume)
    if (maxVol === 0) return

    const barMaxWidth = width * 0.25
    const barX = width - barMaxWidth - 8 // Right side of chart

    // Find POC
    let pocRow = output[0]
    for (const row of output) {
      if (row.volume > pocRow.volume) pocRow = row
    }

    // Calculate value area (70% of total volume)
    const totalVol = output[output.length - 1].cumulative
    const vaThreshold = totalVol * 0.70

    for (const row of output) {
      // Y position: top of chart = highest price
      const yRatio = (row.price - priceMin) / priceRange
      const y = Math.round(height * (1 - yRatio))

      const barWidth = Math.max(1, (row.volume / maxVol) * barMaxWidth)

      // Value Area: green, outside: gray
      const inValueArea = row.cumulative >= (totalVol - vaThreshold) / 2 &&
        row.cumulative <= totalVol - (totalVol - vaThreshold) / 2

      ctx.fillStyle = row === pocRow
        ? 'rgba(255, 235, 59, 0.7)'     // POC — amber
        : inValueArea
          ? 'rgba(76, 175, 80, 0.5)'    // Value Area — green
          : 'rgba(158, 158, 158, 0.4)'  // Outside — gray

      ctx.fillRect(barX, y - 1, barWidth, Math.max(1, height / output.length - 1))
    }

    // Draw POC line
    const pocY = Math.round(height * (1 - (pocRow.price - priceMin) / priceRange))
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.9)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 2])
    ctx.beginPath()
    ctx.moveTo(0, pocY)
    ctx.lineTo(width, pocY)
    ctx.stroke()
    ctx.setLineDash([])

    // Label POC price
    ctx.fillStyle = 'rgba(255, 235, 59, 0.9)'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`POC ${pocRow.price.toFixed(2)}`, 4, pocY - 3)
  },
}

export default volumeProfilePlugin
