'use client'

import './panels.css'
import { useState, useCallback } from 'react'
import { ScriptEngine } from '@tony01/astroneum/script'

const PLACEHOLDER = `// Astroneum Pine â€” JavaScript indicator
// Available: ta.sma, ta.ema, ta.rsi, ta.macd, ta.bbands, ...

study('My SMA', { overlay: true })

const len = input('Length', 20)
const smaLine = ta.sma(close, len)

plot(smaLine, { title: 'SMA' })
`

interface PineEditorPanelProps {
  onCompiled?: (indicatorName: string) => void
}

export default function PineEditorPanel({ onCompiled }: PineEditorPanelProps) {
  const [source, setSource] = useState(PLACEHOLDER)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleCompile = useCallback(() => {
    setError('')
    setSuccess('')
    try {
      const engine = ScriptEngine.getInstance()
      const compiled = engine.compile(source)
      if (compiled.name) {
        onCompiled?.(compiled.name)
        setSuccess(`Compiled and added "${compiled.name}" to chart`)
      }
    } catch (err) {
      setError(String((err as Error).message ?? err))
    }
  }, [source, onCompiled])

  return (
    <div className="term-pine">
      <div className="term-pine-toolbar">
        <span className="term-pine-badge">Pine v5</span>
        <button className="term-pine-btn primary" onClick={handleCompile}>Add to chart</button>
        <button className="term-pine-btn" onClick={() => { setSource(PLACEHOLDER); setError(''); setSuccess('') }}>Reset</button>
      </div>
      <div className="term-pine-editor">
        <textarea
          className="term-pine-code"
          value={source}
          onChange={e => setSource(e.target.value)}
          spellCheck={false}
          placeholder={PLACEHOLDER}
        />
      </div>
      {error && <div className="term-pine-errors">{error}</div>}
      {success && <div className="term-pine-success">{success}</div>}
    </div>
  )
}

export function StrategyTesterPanel() {
  return (
    <div className="term-strategy">
      <div className="term-strategy-empty">
        <div className="term-strategy-empty-icon">ðŸ“Š</div>
        <div className="term-strategy-empty-text">No strategy running</div>
        <div className="term-strategy-empty-hint">
          Write a strategy() in the Pine Editor and add it to the chart to see backtest results here
        </div>
      </div>
    </div>
  )
}

export function TradingPanel() {
  return (
    <div className="term-trading">
      <div className="term-trading-empty">
        <div className="term-trading-empty-icon">ðŸ’¼</div>
        <div className="term-trading-empty-text">No broker connected</div>
        <div className="term-trading-empty-hint">
          Connect a broker to place orders and track positions from the terminal
        </div>
      </div>
    </div>
  )
}

export function StubPanel({ title, icon, hint }: { title: string; icon: string; hint: string }) {
  return (
    <div className="term-panel-stub">
      <div className="term-panel-stub-icon">{icon}</div>
      <div className="term-panel-stub-title">{title}</div>
      <div className="term-panel-stub-text">{hint}</div>
    </div>
  )
}
