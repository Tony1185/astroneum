/**
 * PerformanceMode — data decimation and virtualization utilities.
 *
 * Use these when dealing with very large datasets to keep renders fast:
 *   - `decimate(data, maxBars)` — LTTB downsampling
 *   - `virtualizeWindow(data, start, end, buffer)` — windowed slice
 *   - `shouldDecimate(length, threshold?)` — quick heuristic
 */

import type { CandleData } from '@/engine/common/Data'

// ---------------------------------------------------------------------------
// Heikin-Ashi candle transformation
// ---------------------------------------------------------------------------

/**
 * Transform standard OHLCV bars into Heikin-Ashi candles.
 *
 * Heikin-Ashi candles use averaged values to filter out market noise:
 *   ha_close = (open + high + low + close) / 4
 *   ha_open  = (prev_ha_open + prev_ha_close) / 2
 *   ha_high  = max(high, ha_open, ha_close)
 *   ha_low   = min(low, ha_open, ha_close)
 *
 * @param data  Source candlestick data
 * @returns     New array of Heikin-Ashi candles (same timestamps, volume, turnover)
 */
export function heikinAshi(data: CandleData[]): CandleData[] {
  if (data.length === 0) return []

  const result: CandleData[] = new Array(data.length)

  // First bar: ha_open = (open + close) / 2, ha_close = (open + high + low + close) / 4
  const first = data[0]
  const firstClose = (first.open + first.high + first.low + first.close) / 4
  const firstOpen = (first.open + first.close) / 2
  result[0] = {
    timestamp: first.timestamp,
    open: firstOpen,
    high: Math.max(first.high, firstOpen, firstClose),
    low: Math.min(first.low, firstOpen, firstClose),
    close: firstClose,
    volume: first.volume,
    turnover: first.turnover,
  }

  for (let i = 1; i < data.length; i++) {
    const d = data[i]
    const prev = result[i - 1]
    const haClose = (d.open + d.high + d.low + d.close) / 4
    const haOpen = (prev.open + prev.close) / 2
    result[i] = {
      timestamp: d.timestamp,
      open: haOpen,
      high: Math.max(d.high, haOpen, haClose),
      low: Math.min(d.low, haOpen, haClose),
      close: haClose,
      volume: d.volume,
      turnover: d.turnover,
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// LTTB – Largest Triangle Three Buckets
// ---------------------------------------------------------------------------

export interface Bar {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
  [key: string]: unknown
}

/**
 * Downsample `data` to `targetCount` points using the LTTB algorithm.
 * Always preserves the first and last bar. Returns a new array.
 */
export function decimate<T extends Bar>(data: T[], targetCount: number): T[] {
  if (targetCount <= 0 || data.length <= targetCount) return data

  const sampled: T[] = []
  const bucketSize = (data.length - 2) / (targetCount - 2)

  // First point is always included
  sampled.push(data[0])

  let a = 0

  for (let i = 0; i < targetCount - 2; i++) {
    // Compute the next "A" index range
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1
    const bucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length)

    // Average point in next bucket (used as "C")
    let avgX = 0, avgY = 0
    for (let j = bucketStart; j < bucketEnd; j++) {
      avgX += data[j].timestamp
      avgY += data[j].close
    }
    const count = bucketEnd - bucketStart
    if (count === 0) continue
    avgX /= count
    avgY /= count

    // Find point in current bucket that forms largest triangle with A and avg(C)
    const rangeStart = Math.floor(i * bucketSize) + 1
    const rangeEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, data.length)

    const ax = data[a].timestamp
    const ay = data[a].close

    let maxArea = -1
    let bestIdx = rangeStart

    for (let j = rangeStart; j < rangeEnd; j++) {
      const area = Math.abs(
        (ax - avgX) * (data[j].close - ay) -
        (ax - data[j].timestamp) * (avgY - ay)
      ) / 2

      if (area > maxArea) {
        maxArea = area
        bestIdx = j
      }
    }

    sampled.push(data[bestIdx])
    a = bestIdx
  }

  // Last point is always included
  sampled.push(data[data.length - 1])

  return sampled
}

// ---------------------------------------------------------------------------
// Windowed virtualization
// ---------------------------------------------------------------------------

/**
 * Return only the bars within [visibleStart, visibleEnd] timestamps,
 * extended by `buffer` bars on each side to support look-back indicators.
 */
export function virtualizeWindow<T extends Bar>(
  data: T[],
  visibleStart: number,
  visibleEnd: number,
  buffer = 200
): T[] {
  if (data.length === 0) return data

  // Binary search for start and end indices
  let lo = 0, hi = data.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (data[mid].timestamp < visibleStart) lo = mid + 1
    else hi = mid
  }
  const startIdx = Math.max(0, lo - buffer)

  lo = 0
  hi = data.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (data[mid].timestamp > visibleEnd) hi = mid - 1
    else lo = mid
  }
  const endIdx = Math.max(startIdx, Math.min(data.length - 1, lo + buffer))

  return data.slice(startIdx, endIdx + 1)
}

// ---------------------------------------------------------------------------
// Heuristic
// ---------------------------------------------------------------------------

const DEFAULT_THRESHOLD = 5_000

/**
 * Returns true when the dataset is large enough that decimation makes sense.
 * @param dataLength - Total number of bars in the dataset
 * @param threshold  - Bar count threshold, default 5000
 */
export function shouldDecimate(dataLength: number, threshold = DEFAULT_THRESHOLD): boolean {
  return dataLength > threshold
}

// ---------------------------------------------------------------------------
// Convenience export class
// ---------------------------------------------------------------------------

export class PerformanceMode {
  static decimate = decimate
  static virtualizeWindow = virtualizeWindow
  static shouldDecimate = shouldDecimate
  static heikinAshi = heikinAshi
}

export default PerformanceMode
