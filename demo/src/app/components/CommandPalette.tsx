'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { STANDARD_CRYPTO_SYMBOLS, type SymbolInfo, type Period } from '@tony01/astroneum'

interface CommandAction {
  id: string
  label: string
  hint: string
  group: string
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onSymbolSelect: (symbol: SymbolInfo) => void
  onPeriodChange: (period: Period) => void
  onToggleTheme: () => void
  onToggleReplay: () => void
  onToggleVolumeProfile: () => void
  onToggleDOM: () => void
  onTogglePatterns: () => void
  periods: Period[]
  currentSymbol: string
  currentPeriod: string
}

export default function CommandPalette({
  open,
  onClose,
  onSymbolSelect,
  onPeriodChange,
  onToggleTheme,
  onToggleReplay,
  onToggleVolumeProfile,
  onToggleDOM,
  onTogglePatterns,
  periods,
  currentSymbol,
  currentPeriod,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const actions = useMemo<CommandAction[]>(() => {
    const list: CommandAction[] = [
      ...periods.map(p => ({
        id: `period-${p.text}`,
        label: `Switch to ${p.text}`,
        hint: 'Timeframe',
        group: 'Timeframe',
        run: () => onPeriodChange(p),
      })),
      { id: 'toggle-theme', label: 'Toggle theme', hint: 'View', group: 'Actions', run: onToggleTheme },
      { id: 'toggle-replay', label: 'Toggle bar replay', hint: 'View', group: 'Actions', run: onToggleReplay },
      { id: 'toggle-vp', label: 'Toggle volume profile', hint: 'Indicator', group: 'Actions', run: onToggleVolumeProfile },
      { id: 'toggle-dom', label: 'Toggle depth of market', hint: 'Indicator', group: 'Actions', run: onToggleDOM },
      { id: 'toggle-patterns', label: 'Toggle candlestick patterns', hint: 'Indicator', group: 'Actions', run: onTogglePatterns },
    ]
    return list
  }, [periods, onPeriodChange, onToggleTheme, onToggleReplay, onToggleVolumeProfile, onToggleDOM, onTogglePatterns])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      const symbols = STANDARD_CRYPTO_SYMBOLS.slice(0, 8).map(s => ({
        type: 'symbol' as const,
        symbol: s,
        label: s.ticker,
        hint: s.name ?? s.ticker,
        group: 'Symbols',
      }))
      return [...symbols, ...actions.map(a => ({ type: 'action' as const, action: a, label: a.label, hint: a.hint, group: a.group }))]
    }
    const symbols = STANDARD_CRYPTO_SYMBOLS
      .filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        (s.name ?? '').toLowerCase().includes(q)
      )
      .slice(0, 12)
      .map(s => ({
        type: 'symbol' as const,
        symbol: s,
        label: s.ticker,
        hint: s.name ?? s.ticker,
        group: 'Symbols',
      }))
    const filteredActions = actions
      .filter(a => a.label.toLowerCase().includes(q))
      .map(a => ({ type: 'action' as const, action: a, label: a.label, hint: a.hint, group: a.group }))
    return [...symbols, ...filteredActions]
  }, [query, actions])

  const selectItem = useCallback((index: number) => {
    const item = results[index]
    if (!item) return
    if (item.type === 'symbol') {
      onSymbolSelect(item.symbol)
    } else {
      item.action.run()
    }
    onClose()
  }, [results, onSymbolSelect, onClose])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      const timer = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!open) return null

  return (
    <div className="term-cmdk-overlay" onClick={onClose}>
      <div className="term-cmdk" onClick={e => e.stopPropagation()}>
        <div className="term-cmdk-input-wrap">
          <svg className="term-cmdk-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            className="term-cmdk-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
              else if (e.key === 'Enter') { e.preventDefault(); selectItem(activeIndex) }
              else if (e.key === 'Escape') { e.preventDefault(); onClose() }
            }}
            placeholder="Search symbols, actionsâ€¦"
            spellCheck={false}
          />
          <kbd className="term-cmdk-kbd">Esc</kbd>
        </div>
        <div className="term-cmdk-list">
          {results.length === 0 && (
            <div className="term-cmdk-empty">No results for &ldquo;{query}&rdquo;</div>
          )}
          {results.map((item, i) => (
            <button
              key={item.type === 'symbol' ? `sym-${item.symbol.ticker}` : `act-${item.action.id}`}
              className={`term-cmdk-item${i === activeIndex ? ' is-active' : ''}`}
              onClick={() => selectItem(i)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="term-cmdk-item-label">{item.label}</span>
              <span className="term-cmdk-item-hint">{item.hint}</span>
              {item.type === 'symbol' && item.symbol.ticker === currentSymbol && (
                <span className="term-cmdk-item-badge">current</span>
              )}
              {item.type === 'action' && item.action.id === `period-${currentPeriod}` && (
                <span className="term-cmdk-item-badge">current</span>
              )}
            </button>
          ))}
        </div>
        <div className="term-cmdk-footer">
          <span><kbd>â†‘</kbd><kbd>â†“</kbd> navigate</span>
          <span><kbd>â†µ</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
