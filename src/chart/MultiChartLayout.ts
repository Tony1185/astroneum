import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'

import AstroneumChart from './AstroneumChart'

import type { AstroneumOptions, AstroneumHandle, SymbolInfo, Period, SerializedChartState } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Number of charts in a multi-chart view. */
export type MultiChartCount = 2 | 4 | 8 | 16

/** A slot configuration within the layout. */
export interface MultiChartSlot {
  symbol: SymbolInfo
  period: Period
}

/** Options for creating a MultiChartLayout. */
export interface MultiChartLayoutOptions extends Omit<AstroneumOptions, 'symbol' | 'period'> {
  /** The DOM element (or id) to render the layout into. */
  container: string | HTMLElement
  /**
   * Number of charts to display. Determines the grid.
   * 2  → 1×2 (two columns)
   * 4  → 2×2
   * 8  → 2×4
   * 16 → 4×4
   */
  count?: MultiChartCount
  /** Initial slot configuration. Defaults to the first symbol/period for all slots. */
  slots?: MultiChartSlot[]
  /** Symbol / period used for slots with no explicit configuration. */
  symbol: SymbolInfo
  period: Period
  /** Whether to sync crosshair across all charts (default: true). */
  syncCrosshair?: boolean
  /** Whether to sync symbol and period across all charts (default: false). */
  syncSymbolPeriod?: boolean
  /** localStorage key for layout persistence. Pass null to disable. */
  storageKey?: string | null
}

/** A single chart entry inside the layout. */
interface ChartEntry {
  container: HTMLDivElement
  instance: AstroneumHandle | null
  root: Root
}

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------

interface GridDef { cols: number; rows: number }

function getGrid(count: MultiChartCount): GridDef {
  switch (count) {
    case 2: return { cols: 2, rows: 1 }
    case 4: return { cols: 2, rows: 2 }
    case 8: return { cols: 4, rows: 2 }
    case 16: return { cols: 4, rows: 4 }
    default: return { cols: 2, rows: 1 }
  }
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

interface PersistedLayout {
  count: MultiChartCount
  slots: MultiChartSlot[]
  states?: Array<SerializedChartState | null>
  activeIndex?: number
}

function isMultiChartCount (value: unknown): value is MultiChartCount {
  return value === 2 || value === 4 || value === 8 || value === 16
}

function isSerializedChartState (value: unknown): value is SerializedChartState {
  if (value === null || typeof value !== 'object') return false
  const state = value as Record<string, unknown>
  return state.version === 1 && state.symbol !== null && typeof state.symbol === 'object' && state.period !== null && typeof state.period === 'object'
}

function saveLayout(key: string, data: PersistedLayout): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

function loadLayout(key: string): PersistedLayout | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as PersistedLayout) : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// MultiChartLayout
// ---------------------------------------------------------------------------

/**
 * Manages a grid of Astroneum chart instances inside a single container.
 *
 * @example
 * ```ts
 * const layout = new MultiChartLayout({
 *   container: 'chart-root',
 *   count: 4,
 *   symbol: { ticker: 'AAPL' },
 *   period: { multiplier: 1, timespan: 'day', text: 'D' },
 *   datafeed: myDatafeed,
 *   storageKey: 'my-layout'
 * })
 * ```
 */
export default class MultiChartLayout {
  private _container: HTMLElement
  private _count: MultiChartCount
  private _charts: ChartEntry[] = []
  private _slots: MultiChartSlot[]
  private _options: MultiChartLayoutOptions
  private _storageKey: string | null
  private _syncCrosshair: boolean
  private _syncSymbolPeriod: boolean
  private _activeIndex = 0
  private _wrapperEl: HTMLDivElement | null = null
  private _states: Array<SerializedChartState | null> = []
  private _persistTimer: number | null = null
  private _restoreTimer: number | null = null
  private _readyTimer: number | null = null
  private _restorePending = false
  private _lastPersisted = ''

  constructor(options: MultiChartLayoutOptions) {
    this._options = options
    this._storageKey = options.storageKey !== undefined ? options.storageKey : 'astroneum-multi-layout'
    this._syncCrosshair = options.syncCrosshair ?? true
    this._syncSymbolPeriod = options.syncSymbolPeriod ?? false

    // Resolve container
    if (typeof options.container === 'string') {
      const el = document.getElementById(options.container)
      if (!el) throw new Error(`MultiChartLayout: container #${options.container} not found`)
      this._container = el
    } else {
      this._container = options.container
    }

    // Load persisted layout if available
    let persisted: PersistedLayout | null = null
    if (this._storageKey) {
      persisted = loadLayout(this._storageKey)
    }

    this._count = options.count ?? (isMultiChartCount(persisted?.count) ? persisted.count : 2)

    // Build default slots
    const savedStates = Array.isArray(persisted?.states) ? persisted.states : []
    this._states = Array.from({ length: this._count }, (_, i) => isSerializedChartState(savedStates[i]) ? savedStates[i] : null)
    this._activeIndex = Math.max(0, Math.min(typeof persisted?.activeIndex === 'number' ? persisted.activeIndex : 0, this._count - 1))
    const defaultSlot: MultiChartSlot = { symbol: options.symbol, period: options.period }
    const explicitSlots = options.slots ?? []
    this._slots = Array.from({ length: this._count }, (_, i) => {
      const state = this._states[i]
      return state ? { symbol: state.symbol, period: state.period } : persisted?.slots[i] ?? explicitSlots[i] ?? defaultSlot
    })

    this._render()
    if (this._storageKey) this._persistTimer = window.setInterval(() => this._persist(), 1_500)
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private _render(): void {
    if (!this._restorePending) this._captureStates()
    this._destroy()

    const { cols, rows } = getGrid(this._count)

    // Create wrapper
    const wrapper = document.createElement('div')
    wrapper.className = 'astroneum-multi-layout'
    Object.assign(wrapper.style, {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      width: '100%',
      height: '100%',
      gap: '2px',
      boxSizing: 'border-box'
    })
    this._wrapperEl = wrapper

    for (let i = 0; i < this._count; i++) {
      const slot = this._slots[i]
      const cellEl = document.createElement('div')
      cellEl.className = 'astroneum-multi-cell'
      Object.assign(cellEl.style, {
        position: 'relative',
        overflow: 'hidden',
        minWidth: '0',
        minHeight: '0'
      })

      // Active border
      if (i === this._activeIndex) {
        cellEl.style.outline = '2px solid #1677ff'
      }

      // Click to set active
      cellEl.addEventListener('click', () => this._setActive(i), { capture: true })

      wrapper.appendChild(cellEl)

      // Build per-chart options (omit symbol/period from template)
      const slotOptions: AstroneumOptions = {
        ...this._options,
        symbol: slot.symbol,
        period: slot.period,
        drawingBarVisible: false // in multi-layout, drawing bar takes too much space
      }

      const root = createRoot(cellEl)
      const entry: ChartEntry = { container: cellEl, instance: null, root }
      flushSync(() => {
        root.render(
          React.createElement(AstroneumChart, {
            ...slotOptions,
            ref: (chart: AstroneumHandle | null) => { entry.instance = chart }
          })
        )
      })
      this._charts.push(entry)
    }

    this._container.innerHTML = ''
    this._container.appendChild(wrapper)
    this._initializeCharts()
  }

  private _initializeCharts(): void {
    if (this._charts.some(chart => chart.instance === null)) {
      this._readyTimer = window.setTimeout(() => this._initializeCharts(), 16)
      return
    }
    if (this._syncCrosshair && this._charts.length > 1) {
      for (let i = 0; i < this._charts.length; i++) {
        const chart = this._charts[i].instance!
        chart.onCrosshairMove((data: unknown) => {
          for (let j = 0; j < this._charts.length; j++) {
            if (j === i) continue
            this._charts[j].instance?.setCrosshair(data)
          }
        })
      }
    }
    this._readyTimer = null
    this._restoreStates()
  }

  private _setActive(index: number): void {
    const prev = this._charts[this._activeIndex]
    if (prev) {
      prev.container.style.outline = ''
    }
    this._activeIndex = index
    const next = this._charts[index]
    if (next) {
      next.container.style.outline = '2px solid #1677ff'
    }
    this._persist()
  }

  private _destroy(): void {
    if (this._restoreTimer !== null) {
      window.clearTimeout(this._restoreTimer)
      this._restoreTimer = null
    }
    if (this._readyTimer !== null) {
      window.clearTimeout(this._readyTimer)
      this._readyTimer = null
    }
    for (const { root } of this._charts) {
      root.unmount()
    }
    this._charts = []
    if (this._wrapperEl) {
      this._container.removeChild(this._wrapperEl)
      this._wrapperEl = null
    }
  }

  private _persist(): void {
    if (!this._storageKey) return
    if (!this._restorePending) this._captureStates()
    const data: PersistedLayout = { count: this._count, slots: this._slots, states: this._states, activeIndex: this._activeIndex }
    const serialized = JSON.stringify(data)
    if (serialized === this._lastPersisted) return
    saveLayout(this._storageKey, data)
    this._lastPersisted = serialized
  }

  private _captureStates(): void {
    if (this._charts.length === 0 || this._charts.some(chart => chart.instance === null)) return
    const states = this._charts.map(chart => chart.instance!.serializeState())
    this._states = states
    this._slots = states.map(state => ({ symbol: state.symbol, period: state.period }))
  }

  private _restoreStates(): void {
    if (!this._states.some(state => state !== null)) return
    this._restorePending = true
    const restore = () => {
      if (this._charts.some(chart => chart.instance === null || chart.instance.getIndicators().length === 0)) {
        this._restoreTimer = window.setTimeout(restore, 100)
        return
      }
      this._states.forEach((state, index) => {
        if (state) this._charts[index]?.instance?.loadState(state)
      })
      this._restorePending = false
      this._restoreTimer = null
      this._persist()
    }
    restore()
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Change the layout grid (2 | 4 | 8 | 16). Re-renders all charts. */
  setCount(count: MultiChartCount): void {
    if (!this._restorePending) this._captureStates()
    this._count = count
    // Resize slots array
    const defaultSlot: MultiChartSlot = { symbol: this._options.symbol, period: this._options.period }
    while (this._slots.length < count) {
      this._slots.push(defaultSlot)
    }
    this._slots = this._slots.slice(0, count)
    while (this._states.length < count) {
      this._states.push(null)
    }
    this._states = this._states.slice(0, count)
    this._activeIndex = Math.min(this._activeIndex, count - 1)
    this._render()
    this._persist()
  }

  /** Get the count of charts. */
  getCount(): MultiChartCount {
    return this._count
  }

  /** Get the chart instance at a given index. */
  getChart(index: number): AstroneumHandle | undefined {
    return this._charts[index]?.instance ?? undefined
  }

  /** Get all chart instances. */
  getAllCharts(): AstroneumHandle[] {
    return this._charts.flatMap(chart => chart.instance ? [chart.instance] : [])
  }

  /** Get the index of the currently active (focused) chart. */
  getActiveIndex(): number {
    return this._activeIndex
  }

  /** Get the currently active chart instance. */
  getActiveChart(): AstroneumHandle | undefined {
    return this._charts[this._activeIndex]?.instance ?? undefined
  }

  /**
   * Set the symbol for a specific chart slot (or all slots if syncSymbolPeriod is on).
   */
  setSymbol(symbol: SymbolInfo, index?: number): void {
    const targets = this._syncSymbolPeriod
      ? this._charts.map((_, i) => i)
      : [index ?? this._activeIndex]

    for (const i of targets) {
      const chart = this._charts[i]
      if (chart) {
        chart.instance?.setSymbol(symbol)
        this._slots[i] = { ...this._slots[i], symbol }
      }
    }
    this._persist()
  }

  /**
   * Set the period for a specific chart slot (or all slots if syncSymbolPeriod is on).
   */
  setPeriod(period: Period, index?: number): void {
    const targets = this._syncSymbolPeriod
      ? this._charts.map((_, i) => i)
      : [index ?? this._activeIndex]

    for (const i of targets) {
      const chart = this._charts[i]
      if (chart) {
        chart.instance?.setPeriod(period)
        this._slots[i] = { ...this._slots[i], period }
      }
    }
    this._persist()
  }

  /** Set theme for all charts. */
  setTheme(theme: string): void {
    for (const { instance } of this._charts) {
      instance?.setTheme(theme)
    }
  }

  /** Set locale for all charts. */
  setLocale(locale: string): void {
    for (const { instance } of this._charts) {
      instance?.setLocale(locale)
    }
  }

  /** Save current layout to localStorage immediately. */
  saveLayout(): void {
    this._persist()
  }

  /** Destroy all charts and clean up the DOM. */
  destroy(): void {
    this._persist()
    if (this._persistTimer !== null) {
      window.clearInterval(this._persistTimer)
      this._persistTimer = null
    }
    this._destroy()
  }
}
