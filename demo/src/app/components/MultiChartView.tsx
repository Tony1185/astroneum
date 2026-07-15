'use client'

import './enhancements.css'
import { useState, useRef, useEffect } from 'react'
import { MultiChartLayout, type MultiChartCount, type AstroneumHandle, type SymbolInfo, type Period, type Datafeed } from '@tony01/astroneum'
import type { ChartType } from './ChartTypeDropdown'

interface MultiChartViewProps {
  datafeed: Datafeed
  symbol: SymbolInfo
  period: Period
  periods: Period[]
  theme: string
  chartType: ChartType
  count: MultiChartCount
  syncCrosshair: boolean
  syncSymbolPeriod: boolean
  onActiveChartChange?: (handle: AstroneumHandle | undefined) => void
}

export default function MultiChartView({
  datafeed, symbol, period, periods, theme, chartType, count, syncCrosshair, syncSymbolPeriod, onActiveChartChange
}: MultiChartViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef<MultiChartLayout | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const layout = new MultiChartLayout({
      container: containerRef.current,
      count,
      symbol,
      period,
      periods,
      datafeed,
      theme,
      barStyle: chartType === 'heikin_ashi' ? 'heikin_ashi' : 'candle',
      styles: chartType === 'heikin_ashi' ? undefined : { candle: { type: chartType } as never },
      drawingBarVisible: false,
      syncCrosshair,
      syncSymbolPeriod,
      storageKey: 'astroneum-demo-multi-layout',
    })
    layoutRef.current = layout
    onActiveChartChange?.(layout.getActiveChart())
    return () => {
      layout.destroy()
      layoutRef.current = null
    }
  }, [chartType, count, datafeed, symbol, period, periods, theme, syncCrosshair, syncSymbolPeriod])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

interface LayoutPickerProps {
  value: MultiChartCount | 1
  onChange: (count: MultiChartCount | 1) => void
}

const LAYOUT_OPTIONS: { value: MultiChartCount | 1; cols: number; rows: number; label: string }[] = [
  { value: 1, cols: 1, rows: 1, label: 'Single' },
  { value: 2, cols: 2, rows: 1, label: '2 columns' },
  { value: 4, cols: 2, rows: 2, label: '2Ã—2 grid' },
  { value: 8, cols: 4, rows: 2, label: '2Ã—4 grid' },
]

function GridIcon({ cols, rows }: { cols: number; rows: number }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={1 + c * (18 / cols) + 0.5}
            y={1 + r * (18 / rows) + 0.5}
            width={18 / cols - 1}
            height={18 / rows - 1}
            fill="currentColor"
            fillOpacity={0.7}
            rx="0.5"
          />
        ))
      )}
    </svg>
  )
}

export function LayoutPicker({ value, onChange }: LayoutPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = LAYOUT_OPTIONS.find(o => o.value === value)

  return (
    <div className="term-dropdown" ref={ref}>
      <button
        className="term-icon-btn"
        onClick={() => setOpen(v => !v)}
        title={`Layout: ${current?.label ?? 'Single'}`}
        aria-label="Chart layout"
        aria-expanded={open}
      >
        <GridIcon cols={current?.cols ?? 1} rows={current?.rows ?? 1} />
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: -2 }}>
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="term-dropdown-menu" style={{ minWidth: 180 }}>
          <div className="term-dropdown-section-label">Layout</div>
          <div className="term-layout-grid">
            {LAYOUT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`term-layout-option ${value === opt.value ? 'is-active' : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                title={opt.label}
                aria-label={opt.label}
              >
                <GridIcon cols={opt.cols} rows={opt.rows} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SyncMenuProps {
  syncCrosshair: boolean
  syncSymbolPeriod: boolean
  onCrosshairChange: (v: boolean) => void
  onSymbolPeriodChange: (v: boolean) => void
}

export function SyncMenu({ syncCrosshair, syncSymbolPeriod, onCrosshairChange, onSymbolPeriodChange }: SyncMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="term-dropdown" ref={ref}>
      <button
        className="term-icon-btn"
        onClick={() => setOpen(v => !v)}
        title="Sync settings"
        aria-label="Sync settings"
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M3 10a7 7 0 0 1 12-4.9M17 10a7 7 0 0 1-12 4.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M14 3v3h-3M6 17v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="term-dropdown-menu" style={{ minWidth: 180 }}>
          <div className="term-dropdown-section-label">Sync across charts</div>
          <div className="term-sync-menu">
            <div className="term-sync-item" onClick={() => onCrosshairChange(!syncCrosshair)}>
              <div className={`term-sync-checkbox ${syncCrosshair ? 'checked' : ''}`} />
              <span>Crosshair</span>
            </div>
            <div className="term-sync-item" onClick={() => onSymbolPeriodChange(!syncSymbolPeriod)}>
              <div className={`term-sync-checkbox ${syncSymbolPeriod ? 'checked' : ''}`} />
              <span>Symbol &amp; Period</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
