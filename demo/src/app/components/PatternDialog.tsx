'use client'

import './enhancements.css'
import { useState, useRef, useEffect } from 'react'
import { PATTERN_CATALOGUE, type PatternDef } from '@tony01/astroneum'

interface PatternDialogProps {
  enabledMask: number[]
  onToggle: (index: number) => void
  onClose: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  single: 'Single-bar patterns',
  two: 'Two-bar patterns',
  three: 'Three-bar patterns',
}

const TYPE_COLORS: Record<string, string> = {
  bullish: '#26a69a',
  bearish: '#ef5350',
  neutral: '#6366f1',
}

export default function PatternDialog({ enabledMask, onToggle, onClose }: PatternDialogProps) {
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const filtered = search.trim()
    ? PATTERN_CATALOGUE.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : PATTERN_CATALOGUE

  const categories = ['single', 'two', 'three'] as const
  const enabledCount = enabledMask.filter(v => v === 1).length

  return (
    <div className="term-pattern-dialog" ref={ref}>
      <div className="term-pattern-header">
        <span className="term-pattern-title">Candlestick Patterns</span>
        <span style={{ fontSize: 11, color: 'var(--term-text-2)', marginRight: 8 }}>
          {enabledCount} active
        </span>
        <button className="term-icon-btn" onClick={onClose} title="Close" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--term-border)' }}>
        <input
          className="term-wl-add-input"
          placeholder="Search patterns..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', height: 28 }}
        />
      </div>
      <div className="term-pattern-body">
        {categories.map(cat => {
          const items = filtered.filter(p => p.category === cat)
          if (items.length === 0) return null
          return (
            <div key={cat} className="term-pattern-group">
              <div className="term-pattern-group-label">{CATEGORY_LABELS[cat]}</div>
              {items.map((p: PatternDef) => {
                const globalIdx = PATTERN_CATALOGUE.indexOf(p)
                const enabled = globalIdx < enabledMask.length && enabledMask[globalIdx] === 1
                return (
                  <div
                    key={p.id}
                    className="term-pattern-row"
                    onClick={() => onToggle(globalIdx)}
                  >
                    <div className={`term-sync-checkbox ${enabled ? 'checked' : ''}`} />
                    <span
                      className="term-pattern-row-label"
                      style={{ color: enabled ? TYPE_COLORS[p.type] : 'var(--term-text)' }}
                    >
                      {p.name}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--term-text-muted)', marginLeft: 'auto' }}>
                      {p.type}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--term-text-2)', fontSize: 12 }}>
            No patterns found
          </div>
        )}
      </div>
      <div className="term-pattern-footer">
        <button className="term-pine-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
