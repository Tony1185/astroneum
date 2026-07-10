'use client'

import './panels.css'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { WatchlistManager, AlertManager, type Watchlist } from '@tony01/astroneum'
import AlertDialog from '../../_components/alerts/AlertDialog'

const manager = WatchlistManager.getInstance()
const alertMgr = AlertManager.getInstance()

const CONDITION_LABELS: Record<string, string> = {
  above: '>',
  below: '<',
  crosses_above: 'â†—',
  crosses_below: 'â†˜',
}

interface WatchlistPanelProps {
  onSymbolSelect?: (ticker: string) => void
  selectedTicker?: string
}

export default function WatchlistPanel({ onSymbolSelect, selectedTicker }: WatchlistPanelProps) {
  const [lists, setLists] = useState<Watchlist[]>(manager.getLists())
  const [expandedId, setExpandedId] = useState<string>(manager.getLists()[0]?.id ?? '')
  const [addValue, setAddValue] = useState('')

  useEffect(() => {
    const unsub = manager.onChange(updated => setLists([...updated]))
    return unsub
  }, [])

  const toggleList = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? '' : id)
  }, [])

  const addSymbol = useCallback((listId: string) => {
    const ticker = addValue.trim().toUpperCase()
    if (!ticker) return
    manager.addSymbol(listId, { ticker })
    setAddValue('')
  }, [addValue])

  return (
    <div className="term-watchlist">
      <div className="term-wl-toolbar">
        <span className="term-wl-toolbar-title">Watchlist</span>
        <button className="term-wl-list-btn" onClick={() => { const l = manager.createList('Watchlist'); setExpandedId(l.id) }} title="New list">+</button>
      </div>
      <div className="term-wl-groups">
        {lists.map(list => (
          <div key={list.id} className="term-wl-group">
            <div className="term-wl-group-header" onClick={() => toggleList(list.id)}>
              <span className={`term-wl-arrow ${expandedId === list.id ? 'expanded' : ''}`}>â–¶</span>
              <span className="term-wl-group-name">{list.name}</span>
              <span className="term-wl-group-count">{list.symbols.length}</span>
              <button className="term-wl-list-btn" onClick={e => { e.stopPropagation(); manager.deleteList(list.id) }} title="Delete list">Ã—</button>
            </div>
            {expandedId === list.id && (
              <div className="term-wl-symbols">
                {list.symbols.length === 0 && (
                  <div style={{ padding: '8px 26px', fontSize: 11, color: 'var(--term-text-muted)' }}>No symbols</div>
                )}
                {list.symbols.map(sym => {
                  const change = sym.changePercent
                  const isSelected = sym.ticker === selectedTicker
                  return (
                    <div
                      key={sym.ticker}
                      className={`term-wl-row ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => onSymbolSelect?.(sym.ticker)}
                    >
                      <span className="term-wl-ticker">{sym.ticker}</span>
                      <span className="term-wl-name">{sym.name ?? ''}</span>
                      {change != null && (
                        <span className={`term-wl-change ${change >= 0 ? 'up' : 'down'}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      )}
                      <button
                        className="term-wl-remove"
                        onClick={e => { e.stopPropagation(); manager.removeSymbol(list.id, sym.ticker) }}
                        title="Remove"
                      >Ã—</button>
                    </div>
                  )
                })}
                <div className="term-wl-add">
                  <input
                    className="term-wl-add-input"
                    placeholder="Add symbol..."
                    value={addValue}
                    onChange={e => setAddValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addSymbol(list.id) }}
                  />
                  <button className="term-wl-add-btn" onClick={() => addSymbol(list.id)}>Add</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const CREATE_BTN_STYLE: React.CSSProperties = {
  padding: '4px 12px', border: 'none', borderRadius: 4,
  background: '#2962ff', color: '#fff', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', marginLeft: 'auto', whiteSpace: 'nowrap',
}
const CREATE_BTN_HOVER = '#1e53e5'

function WebhookPill({ status }: { status?: string }) {
  if (!status) return null
  const tone = status === 'delivered'
    ? { color: '#26A69A', bg: 'rgba(38,166,154,0.12)', border: 'rgba(38,166,154,0.40)' }
    : status === 'failed'
      ? { color: '#EF5350', bg: 'rgba(239,83,80,0.12)', border: 'rgba(239,83,80,0.40)' }
      : { color: '#F89D3E', bg: 'rgba(249,157,62,0.12)', border: 'rgba(249,157,62,0.40)' }
  return (
    <span
      title={`Webhook ${status}`}
      style={{
        marginLeft: 6, padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600,
        color: tone.color, background: tone.bg, border: `1px solid ${tone.border}`,
        fontFeatureSettings: "'tnum' 1", textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  )
}

interface AlertsPanelProps {
  symbol?: string
  getCurrentPrice?: () => number | undefined
}

export function AlertsPanel({ symbol = 'BTCUSDT', getCurrentPrice }: AlertsPanelProps = {}) {
  const [, forceUpdate] = useState(0)
  const refresh = useCallback(() => forceUpdate(n => n + 1), [])
  const [showDialog, setShowDialog] = useState(false)

  const allAlerts = alertMgr.getAll()
  const livePrice = getCurrentPrice?.()

  const dialog = showDialog && typeof document !== 'undefined'
    ? createPortal(
        <AlertDialog
          symbol={symbol}
          currentPrice={livePrice}
          onClose={() => setShowDialog(false)}
          onCreated={() => { refresh(); setShowDialog(false) }}
        />,
        document.body,
      )
    : null

  if (allAlerts.length === 0) {
    return (
      <>
        <div className="term-alerts-empty">
          <div className="term-alerts-empty-icon">ðŸ””</div>
          <div className="term-alerts-empty-text">No alerts yet</div>
          <button
            className="term-alert-create"
            style={CREATE_BTN_STYLE}
            onMouseEnter={e => (e.currentTarget.style.background = CREATE_BTN_HOVER)}
            onMouseLeave={e => (e.currentTarget.style.background = '#2962ff')}
            onClick={() => setShowDialog(true)}
          >
            + Create alert
          </button>
        </div>
        {dialog}
      </>
    )
  }

  return (
    <div className="term-alerts">
      <div className="term-wl-toolbar">
        <span className="term-wl-toolbar-title">Alerts</span>
        <span className="term-wl-group-count">{allAlerts.length}</span>
        <button
          className="term-alert-create"
          style={CREATE_BTN_STYLE}
          onMouseEnter={e => (e.currentTarget.style.background = CREATE_BTN_HOVER)}
          onMouseLeave={e => (e.currentTarget.style.background = '#2962ff')}
          onClick={() => setShowDialog(true)}
          title="Create alert"
        >
          + Create
        </button>
      </div>
      <div className="term-alerts-list">
        {allAlerts.map(alert => (
          <div key={alert.id} className="term-alert-row">
            <span className={`term-alert-status ${alert.status}`} />
            <div className="term-alert-info">
              <div className="term-alert-symbol">{alert.symbol}</div>
              <div className="term-alert-condition">
                {CONDITION_LABELS[alert.condition] ?? alert.condition} {alert.price}
                {alert.webhookUrl && <WebhookPill status={alert.webhookStatus} />}
              </div>
            </div>
            <div className="term-alert-actions">
              {alert.status === 'triggered' && (
                <button className="term-alert-btn" onClick={() => { alertMgr.reactivate(alert.id); refresh() }} title="Reactivate">â†»</button>
              )}
              <button className="term-alert-btn delete" onClick={() => { alertMgr.delete(alert.id); refresh() }} title="Delete">Ã—</button>
            </div>
          </div>
        ))}
      </div>
      {dialog}
    </div>
  )
}
