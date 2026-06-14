import type { IndicatorPlugin, Viewport, CandleData } from '@/types'

/**
 * Depth of Market (DOM) / Order Book indicator plugin.
 *
 * Renders a ladder-style order book on the right side of the chart showing
 * cumulative bid/ask volume at each price level.
 *
 * This is a client-side approximation — a real DOM requires Level 2 market
 * data from the exchange. This implementation uses the visible candle data
 * to visualize historical volume distribution at price levels, which is
 * useful for identifying support/resistance and liquidity zones.
 *
 * Usage:
 *   import { domPlugin } from 'astroneum'
 *   registerIndicatorPlugin(domPlugin)
 *   chart.createIndicator({ name: 'dom', calcParams: [20] }) // 20 price levels
 */

export interface DOMLevel {
  price: number
  bidVolume: number
  askVolume: number
  totalVolume: number
}

function computeDOM(data: CandleData[], levels = 20): DOMLevel[] {
  if (data.length === 0) return []

  let priceHigh = -Infinity
  let priceLow = Infinity

  for (const bar of data) {
    if (bar.high > priceHigh) priceHigh = bar.high
    if (bar.low < priceLow) priceLow = bar.low
  }

  const priceRange = priceHigh - priceLow
  if (priceRange <= 0) return []

  const step = priceRange / levels

  const result: DOMLevel[] = []

  for (let i = 0; i < levels; i++) {
    const levelPrice = priceHigh - i * step - step / 2

    let bidVolume = 0
    let askVolume = 0

    for (const bar of data) {
      const vol = bar.volume ?? 0
      // Bars whose close is below this level = buying pressure (bid)
      // Bars whose close is above this level = selling pressure (ask)
      const barRange = bar.high - bar.low
      if (barRange <= 0) continue

      // Proportional volume allocation
      const volPerUnit = vol / barRange
      const overlapLow = Math.max(bar.low, levelPrice - step / 2)
      const overlapHigh = Math.min(bar.high, levelPrice + step / 2)

      if (overlapHigh > overlapLow) {
        const allocation = (overlapHigh - overlapLow) * volPerUnit
        if (bar.close <= levelPrice) {
          bidVolume += allocation
        } else {
          askVolume += allocation
        }
      }
    }

    result.push({
      price: levelPrice,
      bidVolume,
      askVolume,
      totalVolume: bidVolume + askVolume,
    })
  }

  return result.sort((a, b) => b.price - a.price)
}

export const domPlugin: IndicatorPlugin<DOMLevel> = {
  name: 'dom',
  shortName: 'DOM',
  calcParams: [20],

  calc(data: CandleData[], params: number[]): DOMLevel[] {
    const levels = Math.max(5, Math.min(50, Math.round(params[0] ?? 20)))
    return computeDOM(data, levels)
  },

  render2D(
    ctx: CanvasRenderingContext2D,
    output: DOMLevel[],
    viewport: Viewport
  ): void {
    if (output.length === 0) return

    const [width, height] = viewport.resolution
    const priceMin = viewport.priceMin as number
    const priceMax = viewport.priceMax as number
    const priceRange = priceMax - priceMin
    if (priceRange <= 0) return

    const barMaxWidth = width * 0.3
    const barX = width - barMaxWidth - 8
    const rowHeight = Math.max(2, Math.floor(height / output.length))

    // Find max for scaling
    let maxVol = 0
    for (const row of output) {
      const total = row.bidVolume + row.askVolume
      if (total > maxVol) maxVol = total
    }
    if (maxVol === 0) return

    for (const row of output) {
      const yRatio = (row.price - priceMin) / priceRange
      if (yRatio < 0 || yRatio > 1) continue

      const y = Math.round(height * (1 - yRatio))

      const bidWidth = (row.bidVolume / maxVol) * barMaxWidth
      const askWidth = (row.askVolume / maxVol) * barMaxWidth

      // Bid volume (buyers) — green
      if (bidWidth > 0) {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.5)'
        ctx.fillRect(barX, y, bidWidth, rowHeight)
      }

      // Ask volume (sellers) — red
      if (askWidth > 0) {
        ctx.fillStyle = 'rgba(244, 67, 54, 0.5)'
        ctx.fillRect(barX + bidWidth, y, askWidth, rowHeight)
      }
    }

    // Label top and bottom prices
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '9px monospace'
    ctx.textAlign = 'right'

    const top = output[0]
    const topY = Math.round(height * (1 - (top.price - priceMin) / priceRange))
    ctx.fillText(top.price.toFixed(2), width - 4, Math.max(12, topY + 4))

    const bottom = output[output.length - 1]
    const bottomY = Math.round(height * (1 - (bottom.price - priceMin) / priceRange))
    ctx.fillText(bottom.price.toFixed(2), width - 4, Math.min(height - 4, bottomY + 4))
  },
}

export default domPlugin
