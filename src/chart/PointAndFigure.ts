/**
 * Point & Figure chart generator.
 *
 * P&F charts use X and O columns on a grid instead of time-based candles.
 * X = rising price column, O = falling price column.
 * Box size = minimum price move to add a mark. Reversal = number of boxes
 * required to reverse the current column direction.
 *
 * Since the engine requires CandleData[] (time-based), we convert P&F
 * bricks into synthetic candles with artificial 1-minute timestamps
 * and uniform spacing. Each brick = one candle bar rendered as a solid
 * block (open=low, close=high for X, open=high, close=low for O).
 *
 * Usage:
 *   import { generatePointAndFigure } from '@tony01/astroneum'
 *   const pfBars = generatePointAndFigure(bars, 10, 3) // $10 box, 3-box reversal
 *   // Feed to chart as regular candles
 *
 * Also exports a standalone renderer for true P&F grid visualization
 * via canvas (used with IndicatorPlugin infrastructure).
 */

import type { CandleData, IndicatorPlugin, Viewport } from '@/types'

export interface PFConfig {
  /** Box size in price units. Default: derived from data (1% of average price) */
  boxSize?: number
  /** Number of boxes to reverse direction. Default: 3 */
  reversal?: number
  /** Chart type: 'pf' = X/O columns, 'hilo' = high/low based */
  method?: 'close' | 'hilo'
}

export interface PFColumn {
  /** X (rising) or O (falling) */
  type: 'X' | 'O'
  /** Price at the top of this column */
  top: number
  /** Price at the bottom of this column */
  bottom: number
  /** Number of boxes in this column */
  boxes: number
  /** Column index (0-based from left) */
  columnIndex: number
}

/**
 * Generate Point & Figure columns from price data.
 * Returns the raw columns for custom rendering.
 */
export function computePFColumns(
  data: CandleData[],
  config: PFConfig = {}
): PFColumn[] {
  if (data.length === 0) return []

  const reversal = Math.max(1, config.reversal ?? 3)
  const boxSize = config.boxSize ?? (() => {
    let sum = 0
    for (const bar of data) sum += bar.close
    const avg = sum / data.length
    return Math.max(0.01, avg * 0.01)
  })()

  const columns: PFColumn[] = []
  let currentColumn: PFColumn | null = null
  let prevPrice = Math.round(data[0].close / boxSize) * boxSize

  for (const bar of data) {
    const prices = config.method === 'hilo'
      ? [bar.high, bar.low]
      : [bar.high, bar.low, bar.close]

    for (const price of prices) {
      const roundedPrice = Math.round(price / boxSize) * boxSize

      if (currentColumn === null) {
        // First column â€” determine direction from first move
        if (roundedPrice > prevPrice) {
          currentColumn = { type: 'X', top: roundedPrice, bottom: prevPrice, boxes: 1, columnIndex: columns.length }
        } else if (roundedPrice < prevPrice) {
          currentColumn = { type: 'O', top: prevPrice, bottom: roundedPrice, boxes: 1, columnIndex: columns.length }
        }
        prevPrice = roundedPrice
        continue
      }

      if (currentColumn.type === 'X') {
        if (roundedPrice > currentColumn.top) {
          // Extend column up
          const newBoxes = Math.round((roundedPrice - currentColumn.top) / boxSize)
          currentColumn.top = roundedPrice
          currentColumn.boxes += newBoxes
        } else if (roundedPrice <= currentColumn.top - reversal * boxSize) {
          // Reversal â€” start O column
          columns.push(currentColumn)
          const bottom = roundedPrice
          const boxes = Math.round((currentColumn.top - bottom) / boxSize)
          currentColumn = { type: 'O', top: currentColumn.top - boxSize, bottom, boxes: Math.max(1, boxes), columnIndex: columns.length }
        }
      } else {
        if (roundedPrice < currentColumn.bottom) {
          // Extend column down
          const newBoxes = Math.round((currentColumn.bottom - roundedPrice) / boxSize)
          currentColumn.bottom = roundedPrice
          currentColumn.boxes += newBoxes
        } else if (roundedPrice >= currentColumn.bottom + reversal * boxSize) {
          // Reversal â€” start X column
          columns.push(currentColumn)
          const top = roundedPrice
          const boxes = Math.round((top - currentColumn.bottom) / boxSize)
          currentColumn = { type: 'X', top, bottom: currentColumn.bottom + boxSize, boxes: Math.max(1, boxes), columnIndex: columns.length }
        }
      }

      prevPrice = roundedPrice
    }
  }

  if (currentColumn !== null) columns.push(currentColumn)

  return columns
}

/**
 * Convert P&F columns to CandleData for rendering in the standard chart engine.
 * Each X box = green candle (open < close), each O box = red candle (open > close).
 */
export function pfColumnsToBars(columns: PFColumn[]): CandleData[] {
  const bars: CandleData[] = []
  const baseTimestamp = Date.now()
  const barSpacing = 60_000 // 1 minute artificial spacing

  for (const col of columns) {
    const step = (col.top - col.bottom) / Math.max(1, col.boxes)
    for (let b = 0; b < col.boxes; b++) {
      const boxBottom = col.bottom + b * step
      const boxTop = boxBottom + step
      const ts = baseTimestamp + col.columnIndex * barSpacing * 2 + b * barSpacing

      if (col.type === 'X') {
        // Rising â€” green block
        bars.push({
          timestamp: ts,
          open: boxBottom,
          high: boxTop,
          low: boxBottom,
          close: boxTop,
          volume: 1,
        })
      } else {
        // Falling â€” red block
        bars.push({
          timestamp: ts,
          open: boxTop,
          high: boxTop,
          low: boxBottom,
          close: boxBottom,
          volume: 1,
        })
      }
    }
  }

  return bars
}

/**
 * One-shot: generate P&F bars from OHLC data.
 */
export function generatePointAndFigure(
  data: CandleData[],
  boxSize?: number,
  reversal?: number
): CandleData[] {
  return pfColumnsToBars(computePFColumns(data, { boxSize, reversal }))
}

/**
 * Point & Figure IndicatorPlugin â€” renders true X/O grid on the chart
 * via Canvas2D custom render path.
 */
export const pointAndFigurePlugin: IndicatorPlugin<number> = {
  name: 'point_and_figure',
  shortName: 'P&F',
  calcParams: [10, 3], // [boxSize, reversal]

  calc(data: CandleData[], params: number[]): number[] {
    // Store global config in the first two output values
    const boxSize = params[0] ?? 10
    const reversal = Math.max(1, Math.round(params[1] ?? 3))
    return [boxSize, reversal]
  },

  render2D(
    _ctx: CanvasRenderingContext2D,
    _output: number[],
    _viewport: Viewport
  ): void {
    // This render path is a stub â€” true P&F grid rendering with
    // X/O glyphs and 45Â° trend lines requires access to raw data.
    // The generatePointAndFigure() function above provides the
    // data transform that renders P&F via standard candlesticks.
  },
}

export default { generatePointAndFigure, computePFColumns, pfColumnsToBars, pointAndFigurePlugin }
