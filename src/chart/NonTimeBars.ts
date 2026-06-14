/**
 * Non-time-based bar generators: Renko, Kagi, Line Break, Tick, Range, Volume.
 *
 * Each function takes standard time-based OHLC data and produces a new array
 * of synthetic bars where timestamps are artificially spaced for equal-width
 * rendering on a time-based X-axis. This workaround avoids modifying the
 * engine core BarSpace/VisibleRange.
 *
 * Usage:
 *   const renko = generateRenko(bars, 10) // $10 brick size
 *   chart.setData(renko)                  // feed to chart as candles
 */

import type { CandleData } from '@/types'

// ── Renko ──────────────────────────────────────────────────────────────────

/**
 * Generate Renko bricks from OHLC data.
 * Each brick has a fixed price size. A new brick forms when price moves
 * beyond the brick size in either direction.
 *
 * @param data      Source OHLC bars (sorted ascending)
 * @param brickSize Price size of each Renko brick
 * @returns         Array of synthetic bricks with artificial timestamps
 */
export function generateRenko(data: CandleData[], brickSize: number): CandleData[] {
  if (data.length === 0 || brickSize <= 0) return []

  const bricks: CandleData[] = []
  let prevClose = Math.round(data[0].close / brickSize) * brickSize
  let fakeTimestamp = data[0].timestamp

  bricks.push({
    timestamp: fakeTimestamp,
    open: prevClose,
    high: prevClose + brickSize,
    low: prevClose - brickSize,
    close: prevClose,
    volume: data[0].volume,
  })

  for (let i = 1; i < data.length; i++) {
    const bar = data[i]
    const brickCount = Math.floor(Math.abs(bar.close - prevClose) / brickSize)

    if (brickCount >= 1) {
      const direction = bar.close > prevClose ? 1 : -1
      for (let b = 0; b < brickCount; b++) {
        fakeTimestamp += 60_000 // artificial 1-min spacing
        prevClose += direction * brickSize

        const brickClose = prevClose
        const brickOpen = brickClose - direction * brickSize

        bricks.push({
          timestamp: fakeTimestamp,
          open: brickOpen,
          high: Math.max(brickOpen, brickClose),
          low: Math.min(brickOpen, brickClose),
          close: brickClose,
          volume: bar.volume ? bar.volume / brickCount : 0,
        })
      }
    }
  }

  return bricks
}

// ── Kagi ───────────────────────────────────────────────────────────────────

/**
 * Generate Kagi line segments from OHLC data.
 * Kagi draws vertical lines (yang = rising, yin = falling) that reverse
 * when price moves beyond a threshold.
 *
 * @param data         Source OHLC bars (sorted ascending)
 * @param reversalPct  Reversal threshold as percentage (e.g., 3 = 3%)
 * @returns            Array of synthetic bars representing line segments
 */
export function generateKagi(data: CandleData[], reversalPct = 3): CandleData[] {
  if (data.length === 0) return []

  const segments: CandleData[] = []
  let currentHigh = data[0].close
  let currentLow = data[0].close
  let direction: 1 | -1 = 1
  let fakeTimestamp = data[0].timestamp

  const threshold = reversalPct / 100

  for (let i = 1; i < data.length; i++) {
    const bar = data[i]

    if (direction === 1) {
      // Rising (yang)
      if (bar.close > currentHigh) {
        currentHigh = bar.close
      } else if (bar.close < currentHigh * (1 - threshold)) {
        // Reversal — switch to falling
        fakeTimestamp += 60_000
        segments.push({
          timestamp: fakeTimestamp,
          open: currentHigh,
          high: currentHigh,
          low: bar.close,
          close: bar.close,
          volume: bar.volume,
        })
        direction = -1
        currentLow = bar.close
        currentHigh = bar.close
      }
    } else {
      // Falling (yin)
      if (bar.close < currentLow) {
        currentLow = bar.close
      } else if (bar.close > currentLow * (1 + threshold)) {
        // Reversal — switch to rising
        fakeTimestamp += 60_000
        segments.push({
          timestamp: fakeTimestamp,
          open: currentLow,
          high: bar.close,
          low: currentLow,
          close: bar.close,
          volume: bar.volume,
        })
        direction = 1
        currentHigh = bar.close
        currentLow = bar.close
      }
    }
  }

  return segments
}

// ── Tick Bars ──────────────────────────────────────────────────────────────

/**
 * Generate tick bars from raw OHLC data by simulating tick aggregation.
 * Groups bars into buckets of N "ticks" (where each source bar = 1 tick).
 *
 * @param data       Source OHLC bars
 * @param ticksPerBar Number of ticks per synthetic bar
 * @returns           Aggregated tick bars
 */
export function generateTickBars(data: CandleData[], ticksPerBar: number): CandleData[] {
  if (data.length === 0 || ticksPerBar <= 0) return []

  const result: CandleData[] = []
  let fakeTimestamp = data[0].timestamp

  for (let i = 0; i < data.length; i += ticksPerBar) {
    const bucket = data.slice(i, i + ticksPerBar)
    if (bucket.length === 0) break

    const open = bucket[0].open
    let high = -Infinity
    let low = Infinity
    let volume = 0
    let turnover = 0

    for (const bar of bucket) {
      if (bar.high > high) high = bar.high
      if (bar.low < low) low = bar.low
      volume += bar.volume ?? 0
      turnover += bar.turnover ?? 0
    }

    fakeTimestamp += 60_000

    result.push({
      timestamp: fakeTimestamp,
      open,
      high,
      low,
      close: bucket[bucket.length - 1].close,
      volume,
      turnover,
    })
  }

  return result
}

// ── Range Bars ─────────────────────────────────────────────────────────────

/**
 * Generate range bars from OHLC data.
 * Each bar covers a fixed price range. New bar forms when price moves beyond
 * the range boundary.
 *
 * @param data       Source OHLC bars
 * @param rangeSize  Price range per bar
 * @returns           Range bars with artificial timestamps
 */
export function generateRangeBars(data: CandleData[], rangeSize: number): CandleData[] {
  if (data.length === 0 || rangeSize <= 0) return []

  const bars: CandleData[] = []
  let fakeTimestamp = data[0].timestamp
  let barHigh = data[0].high
  let barLow = data[0].low
  let barOpen = data[0].open
  let barClose = data[0].close
  let barVol = data[0].volume ?? 0
  let barTurnover = data[0].turnover ?? 0

  for (let i = 1; i < data.length; i++) {
    const d = data[i]

    if (d.high > barHigh) barHigh = d.high
    if (d.low < barLow) barLow = d.low

    if (barHigh - barLow >= rangeSize) {
      // Close this bar
      fakeTimestamp += 60_000
      bars.push({
        timestamp: fakeTimestamp,
        open: barOpen,
        high: barHigh,
        low: barLow,
        close: barHigh - barLow >= rangeSize ? d.close : barClose,
        volume: barVol,
        turnover: barTurnover,
      })

      // Start new bar
      barOpen = d.close
      barHigh = d.high
      barLow = d.low
      barClose = d.close
      barVol = d.volume ?? 0
      barTurnover = d.turnover ?? 0
    } else {
      barClose = d.close
      barVol += d.volume ?? 0
      barTurnover += d.turnover ?? 0
    }
  }

  return bars
}

export default { generateRenko, generateKagi, generateTickBars, generateRangeBars }
