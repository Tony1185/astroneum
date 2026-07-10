'use client'

import './enhancements.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { BarReplay, type BarReplayState, type CandleData, type Datafeed, type SymbolInfo, type Period } from '@tony01/astroneum'

interface ReplayToolbarProps {
  datafeed: Datafeed
  symbol: SymbolInfo
  period: Period
  onReplayBars: (bars: CandleData[]) => void
  onClose: () => void
}

const SPEEDS = [
  { label: '0.5x', ms: 1000 },
  { label: '1x', ms: 500 },
  { label: '2x', ms: 250 },
  { label: '4x', ms: 125 },
]

function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function ReplayToolbar({ datafeed, symbol, period, onReplayBars, onClose }: ReplayToolbarProps) {
  const replayRef = useRef<BarReplay | null>(null)
  const [state, setState] = useState<BarReplayState>('idle')
  const [cursor, setCursor] = useState(0)
  const [total, setTotal] = useState(0)
  const [currentBar, setCurrentBar] = useState<CandleData | null>(null)
  const [speedIdx, setSpeedIdx] = useState(1)
  const [loading, setLoading] = useState(true)
  const [speedOpen, setSpeedOpen] = useState(false)
  const speedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!speedOpen) return
    const handler = (e: MouseEvent) => {
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) setSpeedOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [speedOpen])

  useEffect(() => {
    let cancelled = false
    const replay = new BarReplay({
      datafeed,
      symbol,
      period,
      intervalMs: SPEEDS[speedIdx].ms,
      onBar: (bar, idx, tot) => {
        if (cancelled) return
        setCurrentBar(bar)
        setCursor(idx)
        setTotal(tot)
        onReplayBars(replay.getRevealedBars())
      },
      onStateChange: (s) => { if (!cancelled) setState(s) },
      onFinish: () => { if (!cancelled) setState('finished') },
    })
    replayRef.current = replay
    setLoading(true)
    void replay.load().then(() => {
      if (cancelled) return
      setLoading(false)
      setCursor(replay.cursor)
      setTotal(replay.total)
      setCurrentBar(replay.currentBar)
      onReplayBars(replay.getRevealedBars())
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => {
      cancelled = true
      replay.destroy()
      replayRef.current = null
    }
  }, [datafeed, symbol, period])

  const handlePlayPause = useCallback(() => {
    replayRef.current?.togglePlayPause()
  }, [])

  const handleStepFwd = useCallback(() => {
    replayRef.current?.stepForward()
  }, [])

  const handleStepBack = useCallback(() => {
    replayRef.current?.stepBack()
  }, [])

  const handleReset = useCallback(() => {
    const r = replayRef.current
    if (!r) return
    r.reset()
    setState('idle')
    setCursor(r.cursor)
    setCurrentBar(r.currentBar)
    onReplayBars(r.getRevealedBars())
  }, [onReplayBars])

  const handleSpeedChange = useCallback((idx: number) => {
    setSpeedIdx(idx)
    replayRef.current?.setSpeed(SPEEDS[idx].ms)
    setSpeedOpen(false)
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = replayRef.current
    if (!r || r.total <= 1) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const targetIdx = Math.round(pct * (r.total - 1))
    r.seekTo(targetIdx)
    setCursor(targetIdx)
    setCurrentBar(r.currentBar)
    onReplayBars(r.getRevealedBars())
  }, [onReplayBars])

  if (loading) {
    return (
      <div className="term-replay-bar">
        <span className="term-replay-badge">Replay</span>
        <span style={{ fontSize: 12, color: 'var(--term-text-2)' }}>Loading historical dataâ€¦</span>
      </div>
    )
  }

  const progressPct = total > 1 ? (cursor / (total - 1)) * 100 : 0

  return (
    <div className="term-replay-bar">
      <span className="term-replay-badge">Replay</span>
      <span className="term-replay-date">
        {currentBar ? formatDate(currentBar.timestamp as number) : 'â€”'}
      </span>
      <button
        className="term-replay-btn"
        onClick={handleStepBack}
        title="Step back"
        disabled={cursor === 0}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11 4L6 8l5 4M6 4v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        className={`term-replay-btn ${state === 'playing' ? 'is-playing' : ''}`}
        onClick={handlePlayPause}
        title={state === 'playing' ? 'Pause' : 'Play'}
        disabled={state === 'finished'}
      >
        {state === 'playing' ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="4" y="3" width="3" height="10" fill="currentColor" rx="0.5"/>
            <rect x="9" y="3" width="3" height="10" fill="currentColor" rx="0.5"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 3l9 5-9 5V3z" fill="currentColor"/>
          </svg>
        )}
      </button>
      <button
        className="term-replay-btn"
        onClick={handleStepFwd}
        title="Step forward"
        disabled={state === 'finished'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M5 4l5 4-5 4M10 4v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="term-replay-progress" onClick={handleProgressClick}>
        <div className="term-replay-progress-fill" style={{ width: `${progressPct}%` }} />
        <div className="term-replay-progress-handle" style={{ left: `${progressPct}%` }} />
      </div>
      <div className="term-dropdown" ref={speedRef}>
        <button className="term-replay-speed" onClick={() => setSpeedOpen(v => !v)}>
          {SPEEDS[speedIdx].label} â–¾
        </button>
        {speedOpen && (
          <div className="term-dropdown-menu" style={{ minWidth: 80, top: 'calc(100% + 4px)', right: 0, left: 'auto' }}>
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                className={`term-dropdown-item ${speedIdx === i ? 'is-active' : ''}`}
                onClick={() => handleSpeedChange(i)}
                style={{ justifyContent: 'center' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="term-replay-btn" onClick={handleReset} title="Reset to start">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 8a4 4 0 1 1 4 4M4 8l2-2M4 8l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button className="term-replay-btn" onClick={onClose} title="Exit replay">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
