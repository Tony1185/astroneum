import type { CandleData, IndicatorPlugin, Viewport } from '@/types'

/**
 * Candlestick pattern recognition plugin.
 *
 * Scans OHLC data for common candlestick patterns and marks them on the chart.
 * Patterns are grouped: single-bar, two-bar, three-bar.
 *
 * Usage:
 *   import { patternRecognitionPlugin, registerIndicatorPlugin } from '@tony01/astroneum'
 *   registerIndicatorPlugin(patternRecognitionPlugin)
 *   chart.createIndicator({ name: 'patterns', calcParams: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] })
 */

export interface PatternMatch {
  index: number
  pattern: string
  type: 'bullish' | 'bearish' | 'neutral'
  timestamp: number
  high: number
  low: number
}

const BULL_COLOR = '#26a69a'
const BEAR_COLOR = '#ef5350'
const NEUTRAL_COLOR = '#2962ff'

function body(bar: CandleData): number {
  return Math.abs(bar.close - bar.open)
}
function upperShadow(bar: CandleData): number {
  return bar.high - Math.max(bar.open, bar.close)
}
function lowerShadow(bar: CandleData): number {
  return Math.min(bar.open, bar.close) - bar.low
}
function range(bar: CandleData): number {
  return bar.high - bar.low
}
function isBullish(bar: CandleData): boolean {
  return bar.close > bar.open
}
function isBearish(bar: CandleData): boolean {
  return bar.close < bar.open
}

function avgBody(data: CandleData[], i: number, lookback: number): number {
  const start = Math.max(0, i - lookback + 1)
  let sum = 0
  let count = 0
  for (let j = start; j <= i; j++) {
    sum += body(data[j])
    count++
  }
  return count > 0 ? sum / count : 0
}

// â”€â”€ Single-bar patterns â”€â”€

function doji(data: CandleData[], i: number): PatternMatch | null {
  if (i < 0 || i >= data.length) return null
  const bar = data[i]
  const r = range(bar)
  if (r === 0) return null
  const b = body(bar)
  if (b / r < 0.05) return { index: i, pattern: 'Doji', type: 'neutral', timestamp: bar.timestamp, high: bar.high, low: bar.low }
  return null
}

function hammer(data: CandleData[], i: number): PatternMatch | null {
  if (i < 0 || i >= data.length) return null
  const bar = data[i]
  const r = range(bar)
  if (r === 0) return null
  const ls = lowerShadow(bar)
  const us = upperShadow(bar)
  const b = body(bar)
  if (ls > 2 * b && us < b * 0.3 && b / r < 0.4) return { index: i, pattern: 'Hammer', type: 'bullish', timestamp: bar.timestamp, high: bar.high, low: bar.low }
  return null
}

function invertedHammer(data: CandleData[], i: number): PatternMatch | null {
  if (i < 0 || i >= data.length) return null
  const bar = data[i]
  const r = range(bar)
  if (r === 0) return null
  const us = upperShadow(bar)
  const ls = lowerShadow(bar)
  const b = body(bar)
  if (us > 2 * b && ls < b * 0.3 && b / r < 0.4) return { index: i, pattern: 'Inverted Hammer', type: 'bullish', timestamp: bar.timestamp, high: bar.high, low: bar.low }
  return null
}

function shootingStar(data: CandleData[], i: number): PatternMatch | null {
  if (i < 0 || i >= data.length) return null
  const bar = data[i]
  const r = range(bar)
  if (r === 0) return null
  const us = upperShadow(bar)
  const ls = lowerShadow(bar)
  const b = body(bar)
  if (isBearish(bar) && us > 2 * b && ls < b * 0.3 && b / r < 0.4) return { index: i, pattern: 'Shooting Star', type: 'bearish', timestamp: bar.timestamp, high: bar.high, low: bar.low }
  return null
}

function hangingMan(data: CandleData[], i: number): PatternMatch | null {
  if (i < 0 || i >= data.length) return null
  const bar = data[i]
  const r = range(bar)
  if (r === 0) return null
  const ls = lowerShadow(bar)
  const us = upperShadow(bar)
  const b = body(bar)
  if (isBullish(bar) && ls > 2 * b && us < b * 0.3 && b / r < 0.4) return { index: i, pattern: 'Hanging Man', type: 'bearish', timestamp: bar.timestamp, high: bar.high, low: bar.low }
  return null
}

function spinningTop(data: CandleData[], i: number): PatternMatch | null {
  if (i < 0 || i >= data.length) return null
  const bar = data[i]
  const r = range(bar)
  if (r === 0) return null
  const b = body(bar)
  const us = upperShadow(bar)
  const ls = lowerShadow(bar)
  if (b / r < 0.3 && us > b && ls > b) return { index: i, pattern: 'Spinning Top', type: 'neutral', timestamp: bar.timestamp, high: bar.high, low: bar.low }
  return null
}

// â”€â”€ Two-bar patterns â”€â”€

function bullishEngulfing(data: CandleData[], i: number): PatternMatch | null {
  if (i < 1 || i >= data.length) return null
  const prev = data[i - 1]
  const curr = data[i]
  if (isBearish(prev) && isBullish(curr) && curr.close >= prev.open && curr.open <= prev.close) {
    if (body(curr) > body(prev)) return { index: i, pattern: 'Bullish Engulfing', type: 'bullish', timestamp: curr.timestamp, high: curr.high, low: curr.low }
  }
  return null
}

function bearishEngulfing(data: CandleData[], i: number): PatternMatch | null {
  if (i < 1 || i >= data.length) return null
  const prev = data[i - 1]
  const curr = data[i]
  if (isBullish(prev) && isBearish(curr) && curr.open >= prev.close && curr.close <= prev.open) {
    if (body(curr) > body(prev)) return { index: i, pattern: 'Bearish Engulfing', type: 'bearish', timestamp: curr.timestamp, high: curr.high, low: curr.low }
  }
  return null
}

function piercingLine(data: CandleData[], i: number): PatternMatch | null {
  if (i < 1 || i >= data.length) return null
  const prev = data[i - 1]
  const curr = data[i]
  const mid = (prev.open + prev.close) / 2
  if (isBearish(prev) && isBullish(curr) && curr.open < prev.low && curr.close > mid && curr.close < prev.open) {
    return { index: i, pattern: 'Piercing Line', type: 'bullish', timestamp: curr.timestamp, high: curr.high, low: curr.low }
  }
  return null
}

function darkCloudCover(data: CandleData[], i: number): PatternMatch | null {
  if (i < 1 || i >= data.length) return null
  const prev = data[i - 1]
  const curr = data[i]
  const mid = (prev.open + prev.close) / 2
  if (isBullish(prev) && isBearish(curr) && curr.open > prev.high && curr.close < mid && curr.close > prev.open) {
    return { index: i, pattern: 'Dark Cloud Cover', type: 'bearish', timestamp: curr.timestamp, high: curr.high, low: curr.low }
  }
  return null
}

function bullishHarami(data: CandleData[], i: number): PatternMatch | null {
  if (i < 1 || i >= data.length) return null
  const prev = data[i - 1]
  const curr = data[i]
  if (isBearish(prev) && isBullish(curr) && curr.open > prev.close && curr.close < prev.open) {
    if (body(curr) < body(prev) * 0.6) return { index: i, pattern: 'Bullish Harami', type: 'bullish', timestamp: curr.timestamp, high: curr.high, low: curr.low }
  }
  return null
}

function bearishHarami(data: CandleData[], i: number): PatternMatch | null {
  if (i < 1 || i >= data.length) return null
  const prev = data[i - 1]
  const curr = data[i]
  if (isBullish(prev) && isBearish(curr) && curr.open < prev.close && curr.close > prev.open) {
    if (body(curr) < body(prev) * 0.6) return { index: i, pattern: 'Bearish Harami', type: 'bearish', timestamp: curr.timestamp, high: curr.high, low: curr.low }
  }
  return null
}

// â”€â”€ Three-bar patterns â”€â”€

function morningStar(data: CandleData[], i: number): PatternMatch | null {
  if (i < 2 || i >= data.length) return null
  const b1 = data[i - 2], b2 = data[i - 1], b3 = data[i]
  const avg = avgBody(data, i, 10)
  if (isBearish(b1) && body(b1) > avg * 0.7 && body(b2) < avg * 0.3 && isBullish(b3) && b3.close > (b1.open + b1.close) / 2)
    return { index: i, pattern: 'Morning Star', type: 'bullish', timestamp: b3.timestamp, high: b3.high, low: b3.low }
  return null
}

function eveningStar(data: CandleData[], i: number): PatternMatch | null {
  if (i < 2 || i >= data.length) return null
  const b1 = data[i - 2], b2 = data[i - 1], b3 = data[i]
  const avg = avgBody(data, i, 10)
  if (isBullish(b1) && body(b1) > avg * 0.7 && body(b2) < avg * 0.3 && isBearish(b3) && b3.close < (b1.open + b1.close) / 2)
    return { index: i, pattern: 'Evening Star', type: 'bearish', timestamp: b3.timestamp, high: b3.high, low: b3.low }
  return null
}

function threeWhiteSoldiers(data: CandleData[], i: number): PatternMatch | null {
  if (i < 2 || i >= data.length) return null
  const b1 = data[i - 2], b2 = data[i - 1], b3 = data[i]
  if (isBullish(b1) && isBullish(b2) && isBullish(b3) && b2.close > b1.close && b3.close > b2.close && b2.open > b1.open && b3.open > b2.open)
    return { index: i, pattern: 'Three White Soldiers', type: 'bullish', timestamp: b3.timestamp, high: b3.high, low: b3.low }
  return null
}

function threeBlackCrows(data: CandleData[], i: number): PatternMatch | null {
  if (i < 2 || i >= data.length) return null
  const b1 = data[i - 2], b2 = data[i - 1], b3 = data[i]
  if (isBearish(b1) && isBearish(b2) && isBearish(b3) && b2.close < b1.close && b3.close < b2.close && b2.open < b1.open && b3.open < b2.open)
    return { index: i, pattern: 'Three Black Crows', type: 'bearish', timestamp: b3.timestamp, high: b3.high, low: b3.low }
  return null
}

function threeInsideUp(data: CandleData[], i: number): PatternMatch | null {
  if (i < 2 || i >= data.length) return null
  const b1 = data[i - 2], b2 = data[i - 1], b3 = data[i]
  if (isBearish(b1) && isBullish(b2) && b2.open > b1.close && b2.close < b1.open && isBullish(b3) && b3.close > b2.close)
    return { index: i, pattern: 'Three Inside Up', type: 'bullish', timestamp: b3.timestamp, high: b3.high, low: b3.low }
  return null
}

function threeInsideDown(data: CandleData[], i: number): PatternMatch | null {
  if (i < 2 || i >= data.length) return null
  const b1 = data[i - 2], b2 = data[i - 1], b3 = data[i]
  if (isBullish(b1) && isBearish(b2) && b2.open < b1.close && b2.close > b1.open && isBearish(b3) && b3.close < b2.close)
    return { index: i, pattern: 'Three Inside Down', type: 'bearish', timestamp: b3.timestamp, high: b3.high, low: b3.low }
  return null
}

// â”€â”€ Pattern catalogue â”€â”€

export interface PatternDef {
  id: string
  name: string
  category: 'single' | 'two' | 'three'
  type: 'bullish' | 'bearish' | 'neutral'
  fn: (data: CandleData[], i: number) => PatternMatch | null
}

export const PATTERN_CATALOGUE: PatternDef[] = [
  // Single-bar
  { id: 'doji', name: 'Doji', category: 'single', type: 'neutral', fn: doji },
  { id: 'hammer', name: 'Hammer', category: 'single', type: 'bullish', fn: hammer },
  { id: 'inverted_hammer', name: 'Inverted Hammer', category: 'single', type: 'bullish', fn: invertedHammer },
  { id: 'shooting_star', name: 'Shooting Star', category: 'single', type: 'bearish', fn: shootingStar },
  { id: 'hanging_man', name: 'Hanging Man', category: 'single', type: 'bearish', fn: hangingMan },
  { id: 'spinning_top', name: 'Spinning Top', category: 'single', type: 'neutral', fn: spinningTop },
  // Two-bar
  { id: 'bullish_engulfing', name: 'Bullish Engulfing', category: 'two', type: 'bullish', fn: bullishEngulfing },
  { id: 'bearish_engulfing', name: 'Bearish Engulfing', category: 'two', type: 'bearish', fn: bearishEngulfing },
  { id: 'piercing_line', name: 'Piercing Line', category: 'two', type: 'bullish', fn: piercingLine },
  { id: 'dark_cloud_cover', name: 'Dark Cloud Cover', category: 'two', type: 'bearish', fn: darkCloudCover },
  { id: 'bullish_harami', name: 'Bullish Harami', category: 'two', type: 'bullish', fn: bullishHarami },
  { id: 'bearish_harami', name: 'Bearish Harami', category: 'two', type: 'bearish', fn: bearishHarami },
  // Three-bar
  { id: 'morning_star', name: 'Morning Star', category: 'three', type: 'bullish', fn: morningStar },
  { id: 'evening_star', name: 'Evening Star', category: 'three', type: 'bearish', fn: eveningStar },
  { id: 'three_white_soldiers', name: 'Three White Soldiers', category: 'three', type: 'bullish', fn: threeWhiteSoldiers },
  { id: 'three_black_crows', name: 'Three Black Crows', category: 'three', type: 'bearish', fn: threeBlackCrows },
  { id: 'three_inside_up', name: 'Three Inside Up', category: 'three', type: 'bullish', fn: threeInsideUp },
  { id: 'three_inside_down', name: 'Three Inside Down', category: 'three', type: 'bearish', fn: threeInsideDown },
]

function scanPatterns(data: CandleData[], enabledMask: number[]): PatternMatch[] {
  const matches: PatternMatch[] = []
  for (let i = 0; i < data.length; i++) {
    for (let p = 0; p < PATTERN_CATALOGUE.length; p++) {
      if (p < enabledMask.length && enabledMask[p] === 0) continue
      const result = PATTERN_CATALOGUE[p].fn(data, i)
      if (result) {
        matches.push(result)
        break
      }
    }
  }
  return matches
}

export const patternRecognitionPlugin: IndicatorPlugin<PatternMatch> = {
  name: 'patterns',
  shortName: 'Patterns',
  calcParams: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

  calc(data: CandleData[], params: number[]): PatternMatch[] {
    const mask = params.length > 0 ? params : PATTERN_CATALOGUE.map(() => 1)
    return scanPatterns(data, mask)
  },

  render2D(ctx: CanvasRenderingContext2D, output: PatternMatch[], viewport: Viewport): void {
    if (output.length === 0) return
    const [width, height] = viewport.resolution
    const timeMin = viewport.timeMin as number
    const timeMax = viewport.timeMax as number
    const timeRange = timeMax - timeMin
    if (timeRange <= 0) return
    const priceMin = viewport.priceMin as number
    const priceMax = viewport.priceMax as number
    const priceRange = priceMax - priceMin
    if (priceRange <= 0) return

    for (const match of output) {
      if (match.timestamp < timeMin || match.timestamp > timeMax) continue
      const xRatio = (match.timestamp - timeMin) / timeRange
      const x = Math.round(xRatio * width)
      const color = match.type === 'bullish' ? BULL_COLOR : match.type === 'bearish' ? BEAR_COLOR : NEUTRAL_COLOR
      const highY = Math.round(height * (1 - (match.high - priceMin) / priceRange))
      const lowY = Math.round(height * (1 - (match.low - priceMin) / priceRange))
      const markerY = match.type === 'bullish' ? lowY + 12 : highY - 12
      const labelY = match.type === 'bullish' ? markerY + 10 : markerY - 6

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, markerY, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.font = '9px Trebuchet MS, sans-serif'
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.fillText(match.pattern, x, labelY)
    }
  }
}
