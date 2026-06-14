import type { CandleData, Period, SymbolInfo } from '@/types'

/**
 * Build a higher-timeframe bar array from lower-TF data using OHLCV resampling.
 *
 * This is a client-side resampler — it aggregates lower-TF bars into higher-TF
 * bars without requiring a second datafeed subscription. The output can be fed
 * to any indicator calc function that expects CandleData[].
 *
 * @example
 * ```ts
 * // Resample 15m bars to 4H bars
 * const h4Bars = resampleBars(bars15m, { multiplier: 4, timespan: 'hour', text: '4H' })
 * const ema4h = sma(h4Bars.map(b => b.close), 21)
 *
 * // Forward-fill to align with lower-TF bars
 * const aligned = forwardFill(h4Bars, bars15m)
 * ```
 *
 * @param data   Source lower-timeframe bars (must be sorted ascending by timestamp)
 * @param period Target higher timeframe
 * @returns      Resampled bars
 */
export function resampleBars(data: CandleData[], period: Period): CandleData[] {
  if (data.length === 0) return []

  const periodMs = periodMultiplierMs(period)
  if (periodMs <= 0) return data

  const result: CandleData[] = []
  let bucketStart = Math.floor(data[0].timestamp / periodMs) * periodMs
  let bucket: CandleData | null = null

  for (const bar of data) {
    const alignedTs = Math.floor(bar.timestamp / periodMs) * periodMs

    if (alignedTs !== bucketStart || bucket === null) {
      // Flush previous bucket
      if (bucket !== null) result.push(bucket)

      // Start new bucket
      bucketStart = alignedTs
      bucket = {
        timestamp: bucketStart,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume ?? 0,
        turnover: bar.turnover ?? 0,
      }
    } else {
      // Merge into current bucket
      bucket.high = Math.max(bucket.high, bar.high)
      bucket.low = Math.min(bucket.low, bar.low)
      bucket.close = bar.close
      bucket.volume = (bucket.volume ?? 0) + (bar.volume ?? 0)
      bucket.turnover = (bucket.turnover ?? 0) + (bar.turnover ?? 0)
    }
  }

  // Flush last bucket
  if (bucket !== null) result.push(bucket)

  return result
}

/**
 * Forward-fill higher-TF indicator values to align with lower-TF bar array.
 * Each lower-TF bar gets the indicator value from the most recent higher-TF bar.
 *
 * @param htValues   Higher-TF indicator values (one per higher-TF bar)
 * @param htBars     Higher-TF bars (same length as htValues)
 * @param ltBars     Lower-TF bars to align to
 * @returns          Array of length ltBars.length, with forward-filled values
 */
export function forwardFill(
  htValues: number[],
  htBars: Pick<CandleData, 'timestamp'>[],
  ltBars: Pick<CandleData, 'timestamp'>[]
): number[] {
  if (htValues.length === 0 || htBars.length === 0 || ltBars.length === 0) {
    return new Array(ltBars.length).fill(NaN)
  }

  const result: number[] = new Array(ltBars.length)
  let htIdx = 0

  for (let ltIdx = 0; ltIdx < ltBars.length; ltIdx++) {
    // Advance HT index until we find the bucket containing this LT bar
    while (
      htIdx + 1 < htBars.length &&
      htBars[htIdx + 1].timestamp <= ltBars[ltIdx].timestamp
    ) {
      htIdx++
    }
    result[ltIdx] = htValues[Math.min(htIdx, htValues.length - 1)]
  }

  return result
}

function periodMultiplierMs(period: Period): number {
  const map: Record<string, number> = {
    second: 1_000,
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
    year: 31_536_000_000,
  }
  return (map[period.timespan] ?? 60_000) * period.multiplier
}

/**
 * Convenience: create a higher-TF indicator factory.
 * Call `calc` on the full lower-TF dataset, then `getValue(i)` for each bar.
 *
 * @example
 * ```ts
 * const h4Sma = mtfIndicator(bars15m, { multiplier: 4, timespan: 'hour', text: '4H' }, (data) => sma(data, 21))
 * const h4SmaValues = bars15m.map((_, i) => h4Sma.getValue(i))
 * ```
 */
export function mtfIndicator<T>(
  data: CandleData[],
  higherPeriod: Period,
  indicatorFn: (data: CandleData[]) => T[]
): { getValue: (index: number) => T | null; result: T[] } {
  const htBars = resampleBars(data, higherPeriod)
  const htValues = indicatorFn(htBars)

  return {
    result: htValues,
    getValue(index: number): T | null {
      if (index < 0 || index >= data.length) return null
      // Find the HT bucket this LT bar belongs to
      const barTs = data[index].timestamp
      const periodMs = periodMultiplierMs(higherPeriod)
      const bucketStart = Math.floor(barTs / periodMs) * periodMs

      for (let i = htBars.length - 1; i >= 0; i--) {
        if (htBars[i].timestamp <= bucketStart) {
          return htValues[i] ?? null
        }
      }
      return null
    },
  }
}

export default { resampleBars, forwardFill, mtfIndicator }
