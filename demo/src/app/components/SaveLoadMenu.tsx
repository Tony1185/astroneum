'use client'

import { useState, useRef, useEffect, useCallback, type RefObject } from 'react'
import { ChartTemplateManager, type AstroneumHandle } from '@tony01/astroneum'

interface SaveLoadMenuProps {
  chartRef: RefObject<AstroneumHandle | null>
}

export default function SaveLoadMenu({ chartRef }: SaveLoadMenuProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Unnamed')
  const [names, setNames] = useState<string[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(() => {
    setNames(ChartTemplateManager.getInstance().list())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Dismiss on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const save = useCallback(() => {
    const chart = chartRef.current
    if (!chart) return
    const input = window.prompt('Save chart layout as:', name === 'Unnamed' ? '' : name)
    if (!input || !input.trim()) return
    const trimmed = input.trim()
    ChartTemplateManager.getInstance().save(trimmed, chart.serializeState())
    setName(trimmed)
    refresh()
    setOpen(false)
  }, [chartRef, name, refresh])

  const load = useCallback((n: string) => {
    const chart = chartRef.current
    if (!chart) return
    if (ChartTemplateManager.getInstance().load(n, chart)) setName(n)
    setOpen(false)
  }, [chartRef])

  const remove = useCallback((n: string) => {
    ChartTemplateManager.getInstance().delete(n)
    if (n === name) setName('Unnamed')
    refresh()
  }, [name, refresh])

  const clearChart = useCallback(() => {
    const chart = chartRef.current
    if (!chart) return
    chart.removeOverlay()
    setName('Unnamed')
    setOpen(false)
  }, [chartRef])

  return (
    <div className="term-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="term-btn term-saveload-btn"
        onClick={() => { setOpen(v => !v); refresh() }}
        title="Save / Load chart layout"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 3h11l3 3v11H3V3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M6 3v4h6V3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          <rect x="6" y="11" width="8" height="6" stroke="currentColor" strokeWidth="1.4" fill="none"/>
        </svg>
        <span className="term-saveload-name">{name}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ opacity: 0.6 }}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="term-menu" role="menu">
          <button type="button" className="term-menu-item" role="menuitem" onClick={save}>
            Save asâ€¦
          </button>
          <button type="button" className="term-menu-item" role="menuitem" onClick={clearChart}>
            Clear drawings
          </button>
          {names.length > 0 && (
            <>
              <div className="term-menu-sep" />
              <div className="term-menu-label">Saved layouts</div>
              {names.map(n => (
                <div key={n} className="term-menu-row">
                  <button
                    type="button"
                    className={`term-menu-item term-menu-item-grow${n === name ? ' is-active' : ''}`}
                    role="menuitem"
                    onClick={() => load(n)}
                  >
                    {n}
                  </button>
                  <button
                    type="button"
                    className="term-menu-del"
                    title={`Delete ${n}`}
                    aria-label={`Delete ${n}`}
                    onClick={() => remove(n)}
                  >
                    Ã—
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
