import type { Datafeed, SymbolInfo, Period, CandleData, IndicatorPlugin, Viewport } from '@/types'

/**
 * CompareOverlay — overlays a second symbol's price as a colored line on the
 * main chart pane. Uses registerIndicatorPlugin infrastructure for rendering.
 *
 * Unlike TradingView's compare feature (which supports dual Y-axis), this
 * implementation normalizes both symbols to percentage change from the first
 * visible bar, making them visually comparable on a single Y-axis.
 *
 * Usage:
 *   const compare = createCompareIndicator('AAPL', myDatafeed)
 *   registerIndicatorPlugin(compare)
 *   chart.createIndicator({ name: 'compare_AAPL' })
 */

export interface CompareIndicatorOptions {
  /** Display name shown in legend */
  name: string
  /** Color of the compare line */
  color?: string
}

/**
 * Create an indicator plugin that overlays a comparison symbol's price data
 * normalized to percentage change.
 */
export function createCompareIndicator(
  compareSymbol: SymbolInfo,
  datafeed: Datafeed,
  period: Period,
  color = '#ff6d00'
): IndicatorPlugin<number> {
  let cachedBars: CandleData[] = []
  let cachedNormalized: number[] = []
  let lastDataLength = -1
  let loadPromise: Promise<void> | null = null

  const name = `compare_${compareSymbol.ticker.replace(/[^a-zA-Z0-9]/g, '_')}`

  return {
    name,
    shortName: compareSymbol.ticker.split(':').pop() ?? compareSymbol.ticker,
    calcParams: [],

    calc(data: CandleData[], _params: number[]): number[] {
      // If data length changed (new bars loaded), re-fetch compare data
      if (data.length !== lastDataLength && data.length > 0) {
        lastDataLength = data.length

        // Use the visible time range to fetch comparable data
        const from = data[0].timestamp
        const to = data[data.length - 1].timestamp

        // Don't block on async — use cached data for this frame, update next frame
        if (loadPromise === null) {
          loadPromise = datafeed.getHistoryData(compareSymbol, period, from, to).then(bars => {
            cachedBars = bars.sort((a, b) => a.timestamp - b.timestamp)

            // Normalize: percentage change from first bar's close
            if (cachedBars.length > 0) {
              const base = cachedBars[0].close
              if (base !== 0) {
                cachedNormalized = cachedBars.map(b => ((b.close - base) / base) * 100)
              } else {
                cachedNormalized = cachedBars.map(() => 0)
              }
            }

            loadPromise = null
          }).catch(() => {
            loadPromise = null
          })
        }
      }

      // Return normalized values aligned to the main chart data
      if (cachedNormalized.length === data.length) {
        return cachedNormalized
      }

      // Not yet loaded — return empty
      return new Array(data.length).fill(NaN)
    },

    render2D(
      ctx: CanvasRenderingContext2D,
      output: number[],
      viewport: Viewport
    ): void {
      if (output.length === 0 || viewport.resolution[0] === 0) return

      const width = viewport.resolution[0]
      const height = viewport.resolution[1]

      // Find min/max of percentage values to scale within the visible range
      let minVal = Infinity
      let maxVal = -Infinity
      for (const v of output) {
        if (isFinite(v)) {
          if (v < minVal) minVal = v
          if (v > maxVal) maxVal = v
        }
      }

      if (!isFinite(minVal)) return

      const range = maxVal - minVal || 1
      const margin = range * 0.05
      const yMin = minVal - margin
      const yMax = maxVal + margin

      const stepX = width / (output.length - 1)

      // Parse color
      let r = 255, g = 109, b = 0
      const a = 0.9
      if (color.startsWith('#')) {
        const h = color.replace('#', '')
        r = parseInt(h.slice(0, 2), 16)
        g = parseInt(h.slice(2, 4), 16)
        b = parseInt(h.slice(4, 6), 16)
      }

      ctx.strokeStyle = `rgba(${r},${g},${b},${a})`
      ctx.lineWidth = 1.5
      ctx.beginPath()

      let started = false
      for (let i = 0; i < output.length; i++) {
        const v = output[i]
        if (!isFinite(v)) { started = false; continue }

        const x = i * stepX
        const y = height - ((v - yMin) / (yMax - yMin)) * height

        if (!started) {
          ctx.moveTo(x, y)
          started = true
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      // Label at the right edge
      const lastIdx = output.length - 1
      const lastVal = output[lastIdx]
      if (isFinite(lastVal)) {
        const labelX = width - 4
        const labelY = height - ((lastVal - yMin) / (yMax - yMin)) * height
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${compareSymbol.ticker} ${lastVal.toFixed(2)}%`, labelX, Math.max(10, Math.min(height - 4, labelY)))
      }
    },
  }
}

export default createCompareIndicator
