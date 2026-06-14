/**
 * PositionVisualizer — renders entry, stop-loss, and take-profit levels
 * directly on the chart as colored horizontal lines with labels.
 *
 * Usage:
 *   const pv = new PositionVisualizer(chart)
 *   pv.show(position)
 *   // When position updates:
 *   pv.update(position)
 *   pv.hide()
 */

import type { Chart } from '@/engine'
import type { Position, PositionSide } from './PortfolioTracker'

const POSITION_GROUP = '__position_lines__'

export interface PositionVisual {
  position: Position
  stopPrice?: number
  targetPrice?: number
}

export class PositionVisualizer {
  private _chart: Chart
  private _active = false

  constructor(chart: Chart) {
    this._chart = chart
  }

  /** Show position lines on the chart. */
  show(visual: PositionVisual): void {
    this.hide()

    const pos = visual.position
    const side = pos.side
    const entry = pos.entryPrice

    // Entry price line
    this._createLine(
      entry,
      'Entry',
      'rgba(255, 255, 255, 0.6)',
      'solid'
    )

    // Stop loss
    if (visual.stopPrice !== undefined) {
      this._createLine(
        visual.stopPrice,
        `Stop: ${visual.stopPrice}`,
        'rgba(247, 82, 95, 0.7)',
        'dashed'
      )
    }

    // Take profit
    if (visual.targetPrice !== undefined) {
      this._createLine(
        visual.targetPrice,
        `Target: ${visual.targetPrice}`,
        'rgba(34, 171, 148, 0.7)',
        'dashed'
      )
    }

    // P&L label at current price (if position is open)
    if (!pos.exitPrice && visual.stopPrice !== undefined && visual.targetPrice !== undefined) {
      const reward = Math.abs(visual.targetPrice - entry)
      const risk = Math.abs(entry - visual.stopPrice)
      const rr = risk > 0 ? `R:R ${(reward / risk).toFixed(1)}` : ''
      this._createLabel(
        entry,
        `${side.toUpperCase()} ${pos.quantity} @ ${entry} | ${rr}`,
        'rgba(255, 255, 255, 0.8)'
      )
    }

    this._active = true
  }

  /** Hide all position lines. */
  hide(): void {
    try {
      this._chart.removeOverlay({ groupId: POSITION_GROUP })
    } catch { /* ignore */ }
    this._active = false
  }

  /** Update position lines (calls show internally). */
  update(visual: PositionVisual): void {
    this.show(visual)
  }

  get active(): boolean {
    return this._active
  }

  private _createLine(
    price: number,
    label: string,
    color: string,
    style: 'solid' | 'dashed'
  ): void {
    try {
      this._chart.createOverlay({
        name: 'priceLine',
        groupId: POSITION_GROUP,
        lock: true,
        visible: true,
        mode: 'normal',
        points: [{ value: price }],
        extendData: label,
        styles: {
          line: {
            color,
            size: 1.5,
            style,
            dashedValue: style === 'dashed' ? [4, 4] : [],
          },
        },
      })
    } catch { /* chart may be disposed */ }
  }

  private _createLabel(
    price: number,
    text: string,
    color: string
  ): void {
    // Labels are rendered via extendData on priceLine overlays.
    // The engine renders extendData as a text label near the line.
    this._createLine(price, text, color, 'solid')
  }
}

export default PositionVisualizer
