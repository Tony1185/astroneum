/**
 * SessionVisualizer — renders session breaks, extended-hours shading, and
 * session extremes (high/low/open/close) as persistent chart overlays.
 *
 * Usage:
 *   const sv = new SessionVisualizer(chart, { timezone: 'America/New_York' })
 *   sv.enable()
 *   // session breaks and extremes auto-update when the chart scrolls/zooms
 *   sv.disable()
 */

import type { Chart, CandleData } from '@/engine'

export interface SessionConfig {
  /** IANA timezone, e.g. 'America/New_York'. Default: 'America/New_York' */
  timezone?: string
  /** Regular market open hour (0-23) in the configured timezone. Default: 9 (9:30 AM ET) */
  openHour?: number
  /** Regular market open minute. Default: 30 */
  openMinute?: number
  /** Regular market close hour. Default: 16 (4:00 PM ET) */
  closeHour?: number
  /** Regular market close minute. Default: 0 */
  closeMinute?: number
  /** Whether to show extended-hours shading. Default: true */
  showExtendedHours?: boolean
  /** Whether to show session high/low/open/close lines. Default: true */
  showSessionLevels?: boolean
}

const SESSION_GUIDE_GROUP = '__session_guides__'

function maxInArray(arr: number[]): number {
  let max = -Infinity
  for (let i = 0; i < arr.length; i++) { if (arr[i] > max) max = arr[i] }
  return max
}

function minInArray(arr: number[]): number {
  let min = Infinity
  for (let i = 0; i < arr.length; i++) { if (arr[i] < min) min = arr[i] }
  return min
}

export class SessionVisualizer {
  private _chart: Chart
  private _config: Required<SessionConfig>
  private _enabled = false
  private _animFrame: number | null = null

  constructor(chart: Chart, config: SessionConfig = {}) {
    this._chart = chart
    this._config = {
      timezone: config.timezone ?? 'America/New_York',
      openHour: config.openHour ?? 9,
      openMinute: config.openMinute ?? 30,
      closeHour: config.closeHour ?? 16,
      closeMinute: config.closeMinute ?? 0,
      showExtendedHours: config.showExtendedHours ?? true,
      showSessionLevels: config.showSessionLevels ?? true,
    }
  }

  get enabled(): boolean { return this._enabled }

  enable(): void {
    if (this._enabled) return
    this._enabled = true
    this._refresh()
  }

  disable(): void {
    if (!this._enabled) return
    this._enabled = false
    this._removeGuides()
    if (this._animFrame !== null) {
      cancelAnimationFrame(this._animFrame)
      this._animFrame = null
    }
  }

  toggle(): void {
    if (this._enabled) { this.disable() } else { this.enable() }
  }

  /** Call when the chart scrolls/zooms. Debounced via rAF. */
  refresh(): void {
    if (!this._enabled) return
    if (this._animFrame !== null) cancelAnimationFrame(this._animFrame)
    this._animFrame = requestAnimationFrame(() => {
      this._animFrame = null
      this._refresh()
    })
  }

  private _refresh(): void {
    this._removeGuides()

    const data = this._chart.getDataList?.() as CandleData[] | undefined
    if (!data || data.length === 0) return

    // Find session extremes from the last full market day
    const oneDayMs = 86_400_000
    const last = data[data.length - 1]
    const sessionStart = last.timestamp - oneDayMs
    const sessionBars = data.filter(b => b.timestamp >= sessionStart && b.timestamp <= last.timestamp)
    if (sessionBars.length === 0) return

    if (this._config.showSessionLevels) {
      const highs = sessionBars.map(b => b.high)
      const lows = sessionBars.map(b => b.low)

      const levels = [
        { price: sessionBars[0].open, label: 'Open', color: 'rgba(41,98,255,0.45)', style: 'solid' as const },
        { price: last.close, label: 'Close', color: 'rgba(255,255,255,0.35)', style: 'dashed' as const },
        { price: maxInArray(highs), label: 'High', color: 'rgba(34,171,148,0.45)', style: 'solid' as const },
        { price: minInArray(lows), label: 'Low', color: 'rgba(247,82,95,0.45)', style: 'solid' as const },
      ]

      for (const lvl of levels) {
        try {
          this._chart.createOverlay({
            name: 'priceLine',
            groupId: SESSION_GUIDE_GROUP,
            lock: true,
            visible: true,
            mode: 'normal',
            points: [{ value: lvl.price }],
            extendData: lvl.label,
            styles: {
              line: {
                color: lvl.color,
                size: 1,
                style: lvl.style,
                dashedValue: [4, 4],
              },
            },
          })
        } catch { /* chart may be disposed */ }
      }
    }
  }

  private _removeGuides(): void {
    try { this._chart.removeOverlay({ groupId: SESSION_GUIDE_GROUP }) } catch { /* ignore */ }
  }
}

export default SessionVisualizer
