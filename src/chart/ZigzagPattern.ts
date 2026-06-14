import type { CandleData, IndicatorPlugin, Viewport } from '@/types'

/**
 * ZigZag indicator — detects swing highs and lows using price deviation.
 *
 * A swing high occurs when price is the highest within a `deviation`-bar
 * window on both sides. The resulting array contains the pivot prices at
 * swing points, with NaN for non-pivot bars.
 *
 * @param data       Source candle data
 * @param deviation  Number of bars to confirm a swing (default 5)
 * @returns          Array of pivot values (NaN = no pivot at that bar)
 */
export function zigzag(data: CandleData[], deviation = 5): number[] {
  const n = data.length
  const result: number[] = new Array(n).fill(NaN)

  if (n < deviation * 2 + 1) return result

  let lastHigh = false
  let lastPivotIdx = -1
  let lastPivotPrice = 0

  for (let i = deviation; i < n - deviation; i++) {
    const bar = data[i]
    const high = bar.high
    const low = bar.low

    // Check if this is a swing high
    let isHigh = true
    for (let j = i - deviation; j <= i + deviation; j++) {
      if (j === i) continue
      if (data[j].high >= high) { isHigh = false; break }
    }

    // Check if this is a swing low
    let isLow = true
    for (let j = i - deviation; j <= i + deviation; j++) {
      if (j === i) continue
      if (data[j].low <= low) { isLow = false; break }
    }

    if (isHigh && (lastPivotIdx === -1 || !lastHigh)) {
      result[i] = high
      lastHigh = true
      lastPivotIdx = i
      lastPivotPrice = high
    } else if (isLow && (lastPivotIdx === -1 || lastHigh)) {
      result[i] = low
      lastHigh = false
      lastPivotIdx = i
      lastPivotPrice = low
    }
  }

  return result
}

/**
 * Detect support and resistance zones from clustered pivot points.
 * Returns price levels where swings cluster within `tolerance` percentage.
 */
export function detectSupportResistance(
  data: CandleData[],
  zigzagDeviation = 5,
  clusterTolerance = 0.005
): Array<{ price: number; count: number; type: 'support' | 'resistance' }> {
  const pivots = zigzag(data, zigzagDeviation)
  const levels: number[] = []

  for (const p of pivots) {
    if (!isNaN(p)) levels.push(p)
  }

  // Cluster similar levels
  const clusters: Array<{ price: number; count: number; highs: number; lows: number }> = []

  for (const level of levels) {
    let found = false
    for (const c of clusters) {
      if (Math.abs(c.price - level) / c.price <= clusterTolerance) {
        c.price = (c.price * c.count + level) / (c.count + 1) // rolling average
        c.count++
        found = true
        break
      }
    }
    if (!found) {
      clusters.push({ price: level, count: 1, highs: 0, lows: 0 })
    }
  }

  // Determine if each cluster is support or resistance
  // A cluster near highs is resistance, near lows is support
  const avgPrice = levels.reduce((a, b) => a + b, 0) / levels.length
  return clusters
    .filter(c => c.count >= 2) // require at least 2 touches
    .map(c => ({
      price: c.price,
      count: c.count,
      type: (c.price > avgPrice ? 'resistance' : 'support') as 'support' | 'resistance',
    }))
    .sort((a, b) => a.price - b.price)
}

/**
 * ZigZag IndicatorPlugin — can be registered as a chart indicator and will
 * render swing lines between pivot points on the chart.
 */
export const zigzagPlugin: IndicatorPlugin<number> = {
  name: 'zigzag',
  shortName: 'ZigZag',
  calcParams: [5],

  calc(data: CandleData[], params: number[]): number[] {
    const deviation = Math.max(2, Math.min(20, Math.round(params[0] ?? 5)))
    return zigzag(data, deviation)
  },

  render2D(
    ctx: CanvasRenderingContext2D,
    output: number[],
    viewport: Viewport
  ): void {
    if (output.length === 0) return

    const [width, height] = viewport.resolution
    const priceMin = viewport.priceMin as number
    const priceMax = viewport.priceMax as number
    const priceRange = priceMax - priceMin
    const timeMin = viewport.timeMin as number
    const timeMax = viewport.timeMax as number
    const timeRange = timeMax - timeMin

    if (priceRange <= 0 || timeRange <= 0) return

    // Collect pivot points
    const pivots: Array<{ x: number; y: number }> = []
    for (let i = 0; i < output.length; i++) {
      if (isNaN(output[i])) continue
      const bar = (() => {
        // Access the data list from the engine — not directly available.
        // Fall back to proportional positioning.
        return { timestamp: timeMin + (timeRange * i) / output.length }
      })()

      const x = Math.round(((bar.timestamp - timeMin) / timeRange) * width)
      const y = Math.round(height * (1 - (output[i] - priceMin) / priceRange))
      pivots.push({ x: Math.max(0, Math.min(width, x)), y: Math.max(0, Math.min(height, y)) })
    }

    if (pivots.length < 2) return

    // Draw connecting lines between pivots
    ctx.strokeStyle = 'rgba(255, 152, 0, 0.7)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(pivots[0].x, pivots[0].y)
    for (let i = 1; i < pivots.length; i++) {
      ctx.lineTo(pivots[i].x, pivots[i].y)
    }
    ctx.stroke()

    // Draw pivot points
    ctx.fillStyle = 'rgba(255, 152, 0, 0.9)'
    for (const p of pivots) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  },
}

export default { zigzag, detectSupportResistance, zigzagPlugin }
