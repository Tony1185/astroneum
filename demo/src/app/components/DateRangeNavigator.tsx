'use client'

import { useState, useEffect, useCallback } from 'react'
import { type ChartPluginContext } from '@tony01/astroneum'

type ChartEngine = ChartPluginContext['chart']

const TIMESPAN_MS: Record<string, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
}

interface RangePreset {
  id: string
  label: string
  ms: number
}

const RANGE_PRESETS: RangePreset[] = [
  { id: '1D', label: '1D', ms: 86_400_000 },
  { id: '1W', label: '1W', ms: 604_800_000 },
  { id: '1M', label: '1M', ms: 2_629_800_000 },
  { id: '3M', label: '3M', ms: 7_889_400_000 },
  { id: '1Y', label: '1Y', ms: 31_557_600_000 },
  { id: '5Y', label: '5Y', ms: 157_788_000_000 },
  { id: 'ALL', label: 'ALL', ms: 0 },
]

function periodMs(period: { multiplier: number; timespan: string }): number {
  return (period.multiplier || 1) * (TIMESPAN_MS[period.timespan] ?? 0)
}

function formatRangeDate(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface DateRangeNavigatorProps {
  engine: ChartEngine | null
  symbol: string
  timezone: string
}

export default function DateRangeNavigator({ engine, symbol, timezone }: DateRangeNavigatorProps) {
  const [active, setActive] = useState<string | null>(null)
  const [rangeLabel, setRangeLabel] = useState('')

  const readRange = useCallback(() => {
    if (!engine) return
    const data = engine.getDataList()
    if (!data.length) {
      setRangeLabel('')
      return
    }
    const vr = engine.getVisibleRange()
    const fromIdx = Math.max(0, Math.min(Math.round(vr.from), data.length - 1))
    const toIdx = Math.max(0, Math.min(Math.round(vr.to), data.length - 1))
    const from = data[fromIdx]
    const to = data[toIdx]
    if (from && to) {
      setRangeLabel(`${formatRangeDate(from.timestamp)} â†’ ${formatRangeDate(to.timestamp)}`)
    }
  }, [engine])

  // Live readout â€” re-read the visible window whenever the user scrolls or zooms.
  useEffect(() => {
    if (!engine) {
      setRangeLabel('')
      return
    }
    const handler: (data?: unknown) => void = () => readRange()
    engine.subscribeAction('onVisibleRangeChange', handler)
    engine.subscribeAction('onZoom', handler)
    readRange()
    return () => {
      engine.unsubscribeAction('onVisibleRangeChange', handler)
      engine.unsubscribeAction('onZoom', handler)
    }
  }, [engine, readRange])

  const applyRange = useCallback((preset: RangePreset) => {
    if (!engine) return
    const dataLen = engine.getDataList().length
    if (!dataLen) return
    // Anchor the latest bar at the right edge first.
    engine.scrollToRealTime()
    const vr = engine.getVisibleRange()
    const currentBars = Math.max(1, vr.to - vr.from)
    let targetBars: number
    if (preset.id === 'ALL') {
      targetBars = dataLen
    } else {
      const p = engine.getPeriod()
      const pm = p ? periodMs(p) : 0
      targetBars = pm > 0 ? Math.round(preset.ms / pm) : dataLen
      targetBars = Math.max(2, Math.min(targetBars, dataLen))
    }
    if (targetBars !== currentBars) {
      const scale = currentBars / targetBars
      engine.zoomAtDataIndex(scale, dataLen - 1, 220)
    }
    setActive(preset.id)
    // readRange() fires via the onVisibleRangeChange subscription as the zoom animates.
  }, [engine])

  return (
    <div className="term-daterange">
      <div className="term-daterange-presets" role="group" aria-label="Visible range presets">
        {RANGE_PRESETS.map(p => (
          <button
            key={p.id}
            type="button"
            className={`term-daterange-btn${active === p.id ? ' is-active' : ''}`}
            onClick={() => applyRange(p)}
            title={p.id === 'ALL' ? 'Show all available bars' : `Show last ${p.id}`}
            aria-pressed={active === p.id}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="term-daterange-info">
        {rangeLabel && (
          <span className="term-daterange-label" data-numeric>{rangeLabel}</span>
        )}
        <span className="term-daterange-meta">{symbol} Â· {timezone}</span>
      </div>
    </div>
  )
}
