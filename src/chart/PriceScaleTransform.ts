/**
 * PriceScaleTransform — log, percentage, and indexed-to-100 price axis
 * scaling implemented as data-level transformations.
 *
 * These transforms work by converting candle OHLC data before it reaches
 * the chart engine, and converting axis tick values back for display.
 * This avoids modifying the engine core Y-axis renderer.
 */

import type { CandleData } from '@/types'

export type PriceScaleMode = 'linear' | 'log' | 'percent' | 'indexed'

function ln(x: number): number {
  if (x <= 0) return Math.log(Math.max(x, 1e-10))
  return Math.log(x)
}

function exp(x: number): number {
  return Math.exp(x)
}

/**
 * Transform OHLC data from linear to the target scale mode.
 * Returns a new array — does not mutate input.
 */
export function transformCandles(
  data: CandleData[],
  mode: PriceScaleMode,
  basePrice?: number
): CandleData[] {
  if (mode === 'linear' || data.length === 0) return data

  const base = basePrice ?? data[0].close

  return data.map(bar => {
    const transform = (v: number): number => {
      switch (mode) {
        case 'log': return ln(v)
        case 'percent': return base !== 0 ? ((v - base) / base) * 100 : 0
        case 'indexed': return base !== 0 ? (v / base) * 100 : 0
        default: return v
      }
    }
    return {
      ...bar,
      open: transform(bar.open),
      high: transform(bar.high),
      low: transform(bar.low),
      close: transform(bar.close),
    }
  })
}

/**
 * Convert a display price from the transformed scale back to linear.
 */
export function untransformPrice(
  value: number,
  mode: PriceScaleMode,
  basePrice: number
): number {
  switch (mode) {
    case 'linear': return value
    case 'log': return exp(value)
    case 'percent':
    case 'indexed':
      return basePrice * (1 + value / 100)
    default: return value
  }
}

/**
 * Format a tick label for the given scale mode.
 */
export function formatScaleTick(
  value: number,
  mode: PriceScaleMode,
  basePrice: number,
  precision = 2
): string {
  const real = untransformPrice(value, mode, basePrice)
  switch (mode) {
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'indexed':
      return value.toFixed(1)
    case 'log':
      return real.toFixed(precision)
    default:
      return real.toFixed(precision)
  }
}

export default { transformCandles, untransformPrice, formatScaleTick }
