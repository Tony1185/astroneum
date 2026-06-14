/**
 * MultiPeriodLayout — renders multiple charts of the same symbol at
 * different timeframes stacked vertically. Crosshair syncs across all
 * panes at the same timestamp.
 *
 * Usage:
 *   const layout = new MultiPeriodLayout({
 *     container: 'chart-root',
 *     symbol: { ticker: 'BTCUSDT', ... },
 *     periods: [
 *       { multiplier: 4, timespan: 'hour', text: '4H' },
 *       { multiplier: 1, timespan: 'hour', text: '1H' },
 *       { multiplier: 15, timespan: 'minute', text: '15m' },
 *     ],
 *     datafeed: myDatafeed,
 *   })
 */

import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'

import AstroneumChart from './AstroneumChart'

import type { AstroneumOptions, AstroneumHandle, SymbolInfo, Period } from '@/types'

export interface MultiPeriodLayoutOptions extends Omit<AstroneumOptions, 'symbol' | 'period'> {
  container: string | HTMLElement
  symbol: SymbolInfo
  /** Periods for each pane (top to bottom). Default: [4H, 1H, 15m] */
  periods?: Period[]
  /** localStorage key for persistence. Pass null to disable. */
  storageKey?: string | null
}

const DEFAULT_PERIODS: Period[] = [
  { multiplier: 4, timespan: 'hour', text: '4H' },
  { multiplier: 1, timespan: 'hour', text: '1H' },
  { multiplier: 15, timespan: 'minute', text: '15m' },
]

interface ChartEntry {
  container: HTMLDivElement
  instance: AstroneumHandle
  root: Root
}

export class MultiPeriodLayout {
  private _container: HTMLElement
  private _periods: Period[]
  private _charts: ChartEntry[] = []
  private _options: MultiPeriodLayoutOptions
  private _storageKey: string | null
  private _wrapperEl: HTMLDivElement | null = null

  constructor(options: MultiPeriodLayoutOptions) {
    this._options = options
    this._periods = options.periods ?? DEFAULT_PERIODS
    this._storageKey = options.storageKey !== undefined ? options.storageKey : 'astroneum-multi-period'

    if (typeof options.container === 'string') {
      const el = document.getElementById(options.container)
      if (!el) throw new Error(`MultiPeriodLayout: container #${options.container} not found`)
      this._container = el
    } else {
      this._container = options.container
    }

    this._render()
  }

  private _render(): void {
    this._destroy()

    const wrapper = document.createElement('div')
    wrapper.className = 'astroneum-multi-period'
    Object.assign(wrapper.style, {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      gap: '2px',
      boxSizing: 'border-box',
    })
    this._wrapperEl = wrapper

    for (let i = 0; i < this._periods.length; i++) {
      const period = this._periods[i]
      const cellEl = document.createElement('div')
      cellEl.className = 'astroneum-multi-period-cell'
      Object.assign(cellEl.style, {
        position: 'relative',
        overflow: 'hidden',
        flex: '1',
        minHeight: '100px',
      })

      if (i === this._periods.length - 1) {
        cellEl.style.outline = '2px solid #1677ff'
      }

      wrapper.appendChild(cellEl)

      const slotOptions: AstroneumOptions = {
        ...this._options,
        symbol: this._options.symbol,
        period,
        drawingBarVisible: false,
      }

      let chartHandle: AstroneumHandle | null = null
      const root = createRoot(cellEl)
      flushSync(() => {
        root.render(
          React.createElement(AstroneumChart, {
            ...slotOptions,
            ref: (chart: AstroneumHandle | null) => { if (chart) chartHandle = chart },
          })
        )
      })
      if (!chartHandle) throw new Error('MultiPeriodLayout: chart initialization failed')
      this._charts.push({ container: cellEl, instance: chartHandle, root })
    }

    // Wire crosshair sync: bottom pane drives, all panes follow
    if (this._charts.length > 1) {
      const driver = this._charts[this._charts.length - 1].instance
      driver.onCrosshairMove((data: unknown) => {
        for (let j = 0; j < this._charts.length - 1; j++) {
          this._charts[j].instance.setCrosshair(data)
        }
      })
    }

    this._container.innerHTML = ''
    this._container.appendChild(wrapper)
  }

  private _destroy(): void {
    for (const { root } of this._charts) {
      root.unmount()
    }
    this._charts = []
    if (this._wrapperEl) {
      this._container.removeChild(this._wrapperEl)
      this._wrapperEl = null
    }
  }

  setTheme(theme: string): void {
    for (const { instance } of this._charts) {
      instance.setTheme(theme)
    }
  }

  setLocale(locale: string): void {
    for (const { instance } of this._charts) {
      instance.setLocale(locale)
    }
  }

  getCharts(): AstroneumHandle[] {
    return this._charts.map(c => c.instance)
  }

  destroy(): void {
    this._destroy()
  }
}

export default MultiPeriodLayout
