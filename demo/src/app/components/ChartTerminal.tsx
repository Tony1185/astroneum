'use client'

import '@tony01/astroneum/style.css'
import './terminal.css'
import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import {
  AstroneumChart,
  UndoManager,
  LayerProvider as ChartLayerProvider,
  DATAFEED_ERROR_EVENT,
  STANDARD_CRYPTO_SYMBOLS,
  createStandardCryptoDatafeed,
  volumeProfilePlugin,
  domPlugin,
  patternRecognitionPlugin,
  PATTERN_CATALOGUE,
  registerIndicatorPlugin,
  type AstroneumHandle,
  type ChartPluginContext,
  type ChartPlugin,
  type DatafeedErrorDetail,
  type Datafeed,
  type SymbolInfo,
  type Period,
  type CandleData,
  type IndicatorSourceOption,
  type ChartToolbarActions,
} from '@tony01/astroneum'
import { AlertManager } from '@tony01/astroneum'
import type { BacktestResult } from '@tony01/astroneum'
import type { CompiledStrategy } from '@tony01/astroneum/script'
import { LayerProvider, WorkspaceAlerts, WorkspaceShell, WorkspaceToolbar, WorkspaceWatchlist, useWorkspaceShell } from '@tony01/astroneum/workspace'
import PineEditorPanel, { StrategyTesterPanel, TradingPanel, StubPanel } from './panels/PineEditorPanel'
import DateRangeNavigator from './DateRangeNavigator'
import CommandPalette from './CommandPalette'
import ChartTypeDropdown, { type ChartType } from './ChartTypeDropdown'
import ReplayToolbar from './ReplayToolbar'
import PatternDialog from './PatternDialog'
import MultiChartView, { LayoutPicker, SyncMenu } from './MultiChartView'
import SaveLoadMenu from './SaveLoadMenu'

// Register pro indicator plugins once at module load
registerIndicatorPlugin(volumeProfilePlugin)
registerIndicatorPlugin(domPlugin)
registerIndicatorPlugin(patternRecognitionPlugin)

interface IndicatorDef {
  name: string
  calcParams?: number[]
}

interface ChartIndicatorSnapshot {
  name: string
  paneId?: string
  shortName?: string
  figures?: Array<{ key: string }>
  result?: Array<Record<string, number>>
}

const PERIODS: Period[] = [
  { multiplier: 1, timespan: 'minute', text: '1m' },
  { multiplier: 3, timespan: 'minute', text: '3m' },
  { multiplier: 5, timespan: 'minute', text: '5m' },
  { multiplier: 15, timespan: 'minute', text: '15m' },
  { multiplier: 30, timespan: 'minute', text: '30m' },
  { multiplier: 1, timespan: 'hour', text: '1H' },
  { multiplier: 2, timespan: 'hour', text: '2H' },
  { multiplier: 4, timespan: 'hour', text: '4H' },
  { multiplier: 1, timespan: 'day', text: 'D' },
  { multiplier: 1, timespan: 'week', text: 'W' },
]

const PRIMARY_PERIODS: Period[] = PERIODS.filter(p => ['1m', '5m', '15m', '1H', '4H', 'D', 'W'].includes(p.text))
const OVERFLOW_PERIODS: Period[] = PERIODS.filter(p => ['3m', '30m', '2H'].includes(p.text))

const LIVE_EXCHANGES = new Set(['BINANCE', 'BINANCE_SPOT', 'BITGET', 'OKX'])
const WORKSPACE_PREFERENCES_KEY = 'astroneum-demo-workspace-preferences'
const PERSISTED_CHART_TYPES: ChartType[] = ['candle', 'candle_stroke', 'candle_up_stroke', 'candle_down_stroke', 'heikin_ashi', 'ohlc', 'area']

function isLayoutCount(value: unknown): value is 1 | 2 | 4 | 8 | 16 {
  return value === 1 || value === 2 || value === 4 || value === 8 || value === 16
}

interface IndicatorCatalogueEntry {
  name: string
  shortName: string
  category: string
  description: string
  defaultParams?: number[]
}

const INDICATOR_CATALOGUE: IndicatorCatalogueEntry[] = [
  { name: 'SMA', shortName: 'SMA', category: 'Moving Averages', description: 'Simple Moving Average', defaultParams: [12, 2] },
  { name: 'EMA', shortName: 'EMA', category: 'Moving Averages', description: 'Exponential Moving Average', defaultParams: [6, 12, 20] },
  { name: 'DEMA', shortName: 'DEMA', category: 'Moving Averages', description: 'Double Exponential Moving Average', defaultParams: [20] },
  { name: 'TEMA', shortName: 'TEMA', category: 'Moving Averages', description: 'Triple Exponential Moving Average', defaultParams: [20] },
  { name: 'WMA', shortName: 'WMA', category: 'Moving Averages', description: 'Weighted Moving Average', defaultParams: [20] },
  { name: 'VWMA', shortName: 'VWMA', category: 'Moving Averages', description: 'Volume Weighted Moving Average', defaultParams: [20] },
  { name: 'AMA', shortName: 'AMA', category: 'Moving Averages', description: 'Adaptive Moving Average (KAMA)', defaultParams: [10] },
  { name: 'HMA', shortName: 'HMA', category: 'Moving Averages', description: 'Hull Moving Average', defaultParams: [20] },
  { name: 'MACD', shortName: 'MACD', category: 'Trend', description: 'Moving Average Convergence Divergence', defaultParams: [12, 26, 9] },
  { name: 'DMI', shortName: 'DMI', category: 'Trend', description: 'Directional Movement Index', defaultParams: [14, 6] },
  { name: 'ADX', shortName: 'ADX', category: 'Trend', description: 'Average Directional Index (standalone)', defaultParams: [14] },
  { name: 'SAR', shortName: 'SAR', category: 'Trend', description: 'Parabolic Stop and Reverse', defaultParams: [2, 2, 20] },
  { name: 'TRIX', shortName: 'TRIX', category: 'Trend', description: 'Triple Exponentially Smoothed Average', defaultParams: [12, 5] },
  { name: 'Ichimoku', shortName: 'Ichimoku', category: 'Trend', description: 'Ichimoku Cloud', defaultParams: [9, 26, 52] },
  { name: 'KC', shortName: 'KC', category: 'Trend', description: 'Keltner Channels', defaultParams: [20, 1.5] },
  { name: 'RSI', shortName: 'RSI', category: 'Momentum', description: 'Relative Strength Index', defaultParams: [6, 12, 24] },
  { name: 'KDJ', shortName: 'KDJ', category: 'Momentum', description: 'Stochastic Oscillator', defaultParams: [9, 3, 3] },
  { name: 'CCI', shortName: 'CCI', category: 'Momentum', description: 'Commodity Channel Index', defaultParams: [13] },
  { name: 'MTM', shortName: 'MTM', category: 'Momentum', description: 'Momentum', defaultParams: [12] },
  { name: 'ROC', shortName: 'ROC', category: 'Momentum', description: 'Rate of Change', defaultParams: [12] },
  { name: '%R', shortName: '%R', category: 'Momentum', description: 'Williams %R', defaultParams: [14] },
  { name: 'AO', shortName: 'AO', category: 'Momentum', description: 'Awesome Oscillator' },
  { name: 'SAMPLE', shortName: 'Sample Study', category: 'Momentum', description: 'Sample Study (alertable oscillator, 0-100)', defaultParams: [14] },
  { name: 'BOLL', shortName: 'BOLL', category: 'Volatility', description: 'Bollinger Bands', defaultParams: [20, 2] },
  { name: 'ATR', shortName: 'ATR', category: 'Volatility', description: 'Average True Range', defaultParams: [14] },
  { name: 'HV', shortName: 'HV', category: 'Volatility', description: 'Historical Volatility (annualized)', defaultParams: [20] },
  { name: 'DC', shortName: 'DC', category: 'Volatility', description: 'Donchian Channels', defaultParams: [20] },
  { name: 'STDDEV', shortName: 'STDDEV', category: 'Volatility', description: 'Standard Deviation', defaultParams: [20] },
  { name: 'VOL', shortName: 'VOL', category: 'Volume', description: 'Volume', defaultParams: [7, 25, 99] },
  { name: 'OBV', shortName: 'OBV', category: 'Volume', description: 'On Balance Volume', defaultParams: [30] },
  { name: 'PVT', shortName: 'PVT', category: 'Volume', description: 'Price and Volume Trend' },
  { name: 'CMF', shortName: 'CMF', category: 'Volume', description: 'Chaikin Money Flow', defaultParams: [20] },
  { name: 'MFI', shortName: 'MFI', category: 'Volume', description: 'Money Flow Index', defaultParams: [14] },
  { name: 'A/D', shortName: 'A/D', category: 'Volume', description: 'Accumulation / Distribution' },
  { name: 'VROC', shortName: 'VROC', category: 'Volume', description: 'Volume Rate of Change', defaultParams: [14] },
  { name: 'VR', shortName: 'VR', category: 'Volume', description: 'Volume Ratio', defaultParams: [24] },
  { name: 'BRAR', shortName: 'BRAR', category: 'Oscillators', description: 'BRAR Emotional Indicator', defaultParams: [26] },
  { name: 'BBI', shortName: 'BBI', category: 'Oscillators', description: 'Bull and Bear Index', defaultParams: [3, 6, 12, 24] },
  { name: 'PSY', shortName: 'PSY', category: 'Oscillators', description: 'Psychological Line', defaultParams: [12, 6] },
  { name: 'BIAS', shortName: 'BIAS', category: 'Oscillators', description: 'Bias Indicator', defaultParams: [6, 12, 24] },
  { name: 'EMV', shortName: 'EMV', category: 'Oscillators', description: 'Ease of Movement Value', defaultParams: [9, 14] },
  { name: 'DMA', shortName: 'DMA', category: 'Oscillators', description: 'Difference of Moving Average', defaultParams: [5, 10, 20, 60] },
  { name: 'CR', shortName: 'CR', category: 'Oscillators', description: 'Current Ratio', defaultParams: [26] },
  { name: 'VWAP', shortName: 'VWAP', category: 'Market Profile', description: 'Volume Weighted Average Price' },
  { name: 'PP', shortName: 'PP', category: 'Market Profile', description: 'Pivot Points (Classic)' },
  { name: 'SuperTrend', shortName: 'SuperTrend', category: 'Advanced', description: 'SuperTrend', defaultParams: [10, 3] },
  { name: 'ZZ', shortName: 'ZZ', category: 'Advanced', description: 'ZigZag', defaultParams: [5] },
  { name: 'CORR', shortName: 'CORR', category: 'Statistical', description: 'Correlation Coefficient', defaultParams: [20] },
  { name: 'LinReg', shortName: 'LinReg', category: 'Statistical', description: 'Linear Regression Line', defaultParams: [20] },
]

const OVERLAY_INDICATORS = new Set([
  'SMA', 'EMA', 'DEMA', 'TEMA', 'WMA', 'VWMA', 'AMA', 'HMA',
  'BOLL', 'DC', 'KC', 'SAR', 'Ichimoku', 'SuperTrend', 'VWAP',
  'PP', 'ZZ', 'LinReg', 'BBI',
])

function indicatorDef(name: string): IndicatorDef | null {
  const entry = INDICATOR_CATALOGUE.find(e => e.name === name)
  if (!entry) return null
  return { name: entry.name, calcParams: entry.defaultParams }
}

function isOverlay(name: string): boolean {
  return OVERLAY_INDICATORS.has(name)
}

// â”€â”€ Icons (inline SVG, 24px) â”€â”€
const Icon = {
  Watchlist: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Alert: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3a6 6 0 016 6v4l2 3H4l2-3V9a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Trading: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="6" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 10h2M8 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Details: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 8v.01M11 11h1v5h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="15" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  News: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Ideas: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 17h6M10 20h4M12 3a6 6 0 014 10c-1 1-1 2-1 3H9c0-1 0-2-1-3a6 6 0 014-10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
}

// â”€â”€ Sidebar content (Phase 1 placeholder â€” Phase 3 fills with WatchlistWidget etc.) â”€â”€
const SIDEBAR_TABS = [
  { id: 'watchlist', label: 'Watchlist', icon: Icon.Watchlist },
  { id: 'alerts', label: 'Alerts', icon: Icon.Alert },
  { id: 'calendar', label: 'Calendar', icon: Icon.Calendar },
  { id: 'ideas', label: 'Ideas', icon: Icon.Ideas },
  { id: 'trading', label: 'Trading', icon: Icon.Trading },
] as const
function SidebarContent({ onSymbolSelect, selectedTicker, symbol, datafeed, getCurrentPrice, getIndicatorSources }: { onSymbolSelect?: (t: string) => void; selectedTicker?: string; symbol?: SymbolInfo; datafeed: Datafeed; getCurrentPrice?: () => number | undefined; getIndicatorSources?: () => IndicatorSourceOption[] }) {
  const [active, setActive] = useState('watchlist')
  const { sidebarOpen, toggleSidebar } = useWorkspaceShell()
  const activeTab = SIDEBAR_TABS.find(t => t.id === active)

  const selectTab = (id: typeof active) => {
    if (active === id && sidebarOpen) {
      toggleSidebar()
      return
    }
    if (!sidebarOpen) toggleSidebar()
    setActive(id)
  }

  return (
    <>
      <div className="term-sidebar-body" aria-hidden={!sidebarOpen} inert={!sidebarOpen}>
        <div className="term-sidebar-header">
          <span className="term-sidebar-title">{activeTab?.label ?? ''}</span>
          <button className="term-icon-btn" onClick={toggleSidebar} title="Hide panel" aria-label="Hide panel">×</button>
        </div>
        <div className="term-sidebar-content">
          <div hidden={active !== 'watchlist'} style={{ height: '100%' }}><WorkspaceWatchlist onSymbolSelect={onSymbolSelect} selectedTicker={selectedTicker} datafeed={datafeed} open={sidebarOpen} /></div>
          <div hidden={active !== 'alerts'} style={{ height: '100%' }}><WorkspaceAlerts symbol={symbol?.ticker ?? 'BTCUSDT'} currentPrice={getCurrentPrice?.()} indicatorSources={getIndicatorSources?.()} onSymbolChange={onSymbolSelect} /></div>
          <div hidden={active !== 'calendar'} style={{ height: '100%' }}><StubPanel title="Calendar" icon="ðŸ“…" hint="Economic calendar events â€” wired when an economic data feed is connected" /></div>
          <div hidden={active !== 'ideas'} style={{ height: '100%' }}><StubPanel title="Ideas" icon="ðŸ’¡" hint="Published community ideas â€” wired when an ideas API is connected" /></div>
          <div hidden={active !== 'trading'} style={{ height: '100%' }}><StubPanel title="Trading" icon="ðŸ’¼" hint="Connect a broker to place orders and track positions" /></div>
        </div>
      </div>
      <nav className="term-sidebar-strip" aria-label="Right sidebar">
        {SIDEBAR_TABS.map(tab => {
          const IconComp = tab.icon
          return (
            <button
              key={tab.id}
              className={`term-sidebar-tab ${active === tab.id ? 'is-active' : ''}`}
              onClick={() => selectTab(tab.id)}
              title={tab.label}
              aria-label={tab.label}
              aria-pressed={active === tab.id && sidebarOpen}
              data-semantic-id={`sidebar.${tab.id}`}
            >
              <IconComp />
              <span className="term-sidebar-tab-label">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

// â”€â”€ Dock content (Phase 1 placeholder â€” Phase 3 fills with Pine Editor etc.) â”€â”€
type DockTab = { id: string; label: string; report?: boolean }

function DockContent({ onPineCompiled, onStrategyCompiled, result, strategyError }: { onPineCompiled?: (name: string) => void; onStrategyCompiled?: (strategy: CompiledStrategy) => void; result?: BacktestResult | null; strategyError?: string | null }) {
  const { dockOpen, dockMaximized, toggleDock, toggleDockMaximized } = useWorkspaceShell()
  const [reports, setReports] = useState<DockTab[]>([{ id: 'strategy', label: 'Strategy Tester', report: true }])
  const [active, setActive] = useState('pine')
  const [menuTab, setMenuTab] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const tabs: DockTab[] = [{ id: 'pine', label: 'Pine Editor' }, ...reports, { id: 'trading', label: 'Trading Panel' }]

  const selectTab = (id: string, collapseActive = true) => {
    if (id === active && dockOpen && collapseActive) {
      toggleDock()
      return
    }
    setActive(id)
    if (!dockOpen) toggleDock()
    setMoreOpen(false)
  }
  const renameReport = (tab: DockTab) => {
    const label = window.prompt('Report name', tab.label)?.trim()
    if (label) setReports(current => current.map(item => item.id === tab.id ? { ...item, label } : item))
    setMenuTab(null)
  }
  const duplicateReport = (tab: DockTab) => {
    const id = `strategy-${Date.now()}`
    setReports(current => [...current, { id, label: `${tab.label} copy`, report: true }])
    selectTab(id)
    setMenuTab(null)
  }
  const closeReport = (tab: DockTab) => {
    setReports(current => current.filter(item => item.id !== tab.id))
    if (active === tab.id) setActive('pine')
    setMenuTab(null)
  }
  const onStrategy = (strategy: CompiledStrategy) => {
    onStrategyCompiled?.(strategy)
    if (reports.length === 0) setReports([{ id: 'strategy', label: 'Strategy Tester', report: true }])
    selectTab(reports[0]?.id ?? 'strategy')
  }

  return <>
    <div className="term-dock-tabs" role="tablist" aria-label="Bottom panel">
      {tabs.map((tab, index) => <div className="term-dock-tab-wrap" key={tab.id}>
        <button id={`dock-tab-${tab.id}`} role="tab" aria-selected={active === tab.id} aria-controls={`dock-panel-${tab.id}`} className={`term-dock-tab ${active === tab.id ? 'is-active' : ''}`} onClick={() => selectTab(tab.id)} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
          selectTab(tabs[next].id, false)
        }}>{tab.label}</button>
        {tab.report && <button className="term-dock-tab-menu" aria-label={`Actions for ${tab.label}`} aria-expanded={menuTab === tab.id} onClick={() => setMenuTab(menuTab === tab.id ? null : tab.id)}>•••</button>}
        {menuTab === tab.id && <div className="term-dock-menu" role="menu"><button role="menuitem" onClick={() => renameReport(tab)}>Rename</button><button role="menuitem" onClick={() => duplicateReport(tab)}>Duplicate</button><button role="menuitem" onClick={() => closeReport(tab)}>Close</button></div>}
      </div>)}
      <div className="term-dock-controls">
        <button className="term-icon-btn" onClick={() => setMoreOpen(v => !v)} title="More tabs" aria-label="More tabs" aria-expanded={moreOpen}>•••</button>
        {moreOpen && <div className="term-dock-menu term-dock-more" role="menu">{tabs.map(tab => <button key={tab.id} role="menuitem" onClick={() => selectTab(tab.id)}>{tab.label}</button>)}</div>}
        <button className="term-icon-btn" onClick={toggleDockMaximized} title={dockMaximized ? 'Restore panel' : 'Maximize panel'} aria-label={dockMaximized ? 'Restore panel' : 'Maximize panel'}>{dockMaximized ? '↙' : '↗'}</button>
        <button className="term-icon-btn" onClick={toggleDock} title={dockOpen ? 'Minimize' : 'Expand'} aria-label={dockOpen ? 'Minimize panel' : 'Expand panel'}>{dockOpen ? '⌃' : '⌄'}</button>
      </div>
    </div>
    {dockOpen && <div className="term-dock-body">
      <section id="dock-panel-pine" role="tabpanel" aria-labelledby="dock-tab-pine" hidden={active !== 'pine'}><PineEditorPanel onCompiled={onPineCompiled} onStrategyCompiled={onStrategy} /></section>
      {reports.map(tab => <section key={tab.id} id={`dock-panel-${tab.id}`} role="tabpanel" aria-labelledby={`dock-tab-${tab.id}`} hidden={active !== tab.id}><StrategyTesterPanel result={result} error={strategyError} /></section>)}
      <section id="dock-panel-trading" role="tabpanel" aria-labelledby="dock-tab-trading" hidden={active !== 'trading'}><TradingPanel /></section>
    </div>}
  </>
}

// â”€â”€ Chart engine bridge â”€â”€
// <AstroneumChart> exposes AstroneumHandle, but the date-range navigator needs
// the full engine (scrollToRealTime / zoomAtDataIndex / getVisibleRange). A
// ChartPlugin captures it in onInit and hands it to React state. This is the
// library-blessed extension path â€” no forking (see design-astroneum.md Â§9).
type ChartEngine = ChartPluginContext['chart']

function IntervalOverflow({ currentPeriod, periods, onSelect }: { currentPeriod: Period; periods: Period[]; onSelect: (p: Period) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = periods.some(p => p.text === currentPeriod.text)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="term-dropdown" ref={ref} style={{ display: 'inline-flex' }}>
      <button
        className={`term-toolbar-icon${isActive ? ' is-active' : ''}`}
        onClick={() => setOpen(v => !v)}
        title="More intervals"
        aria-label="More intervals"
        aria-expanded={open}
        style={{ fontSize: 11 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="11" cy="7" r="1.2" fill="currentColor"/>
        </svg>
      </button>
      {open && (
        <div className="term-dropdown-menu" style={{ minWidth: 80 }}>
          {periods.map(p => (
            <button
              key={p.text}
              className={`term-dropdown-item ${p.text === currentPeriod.text ? 'is-active' : ''}`}
              onClick={() => { onSelect(p); setOpen(false) }}
            >
              <span className="term-dropdown-item-label">{p.text}</span>
              {p.text === currentPeriod.text && (
                <svg className="term-dropdown-item-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// â”€â”€ Main terminal component â”€â”€
export default function ChartTerminal() {
  const chartRef = useRef<AstroneumHandle>(null)
  const undoRef = useRef<UndoManager | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)
  const chartToolbarRef = useRef<ChartToolbarActions | null>(null)
  const symbols = STANDARD_CRYPTO_SYMBOLS
  const [chartEngine, setChartEngine] = useState<ChartEngine | null>(null)

  // Capture the full chart engine for the date-range navigator via a plugin.
  // mountChartPlugins runs once on mount (empty-dep effect in AstroneumChart),
  // so this fires a single time and disposes on unmount.
  const rangeNavPlugin = useMemo<ChartPlugin[]>(
    () => [{
      name: 'date-range-navigator',
      onInit: (ctx) => { setChartEngine(ctx.chart); return () => setChartEngine(null) },
    }],
    [],
  )

  const [symbol, setSymbol] = useState<SymbolInfo>(symbols[0])
  const [period, setPeriod] = useState<Period>(PERIODS[0])
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [activeSubIndicators] = useState<string[]>(['VOL', 'SAMPLE'])
  const [activeMainIndicators] = useState<string[]>(['EMA'])
  const [datafeedError, setDatafeedError] = useState<string | null>(null)
  const [timezone, setTimezone] = useState('UTC')
  const [chartType, setChartType] = useState<ChartType>('candle')
  const [vpActive, setVpActive] = useState(false)
  const [domActive, setDomActive] = useState(false)
  const [cmdkOpen, setCmdkOpen] = useState(false)
  const [replayActive, setReplayActive] = useState(false)
  const [patternDialogOpen, setPatternDialogOpen] = useState(false)
  const [patternActive, setPatternActive] = useState(false)
  const [patternMask, setPatternMask] = useState<number[]>(PATTERN_CATALOGUE.map(() => 1))
  const [layoutCount, setLayoutCount] = useState<1 | 2 | 4 | 8 | 16>(1)
  const [syncCrosshair, setSyncCrosshair] = useState(true)
  const [syncSymbolPeriod, setSyncSymbolPeriod] = useState(false)
  const [workspacePreferencesLoaded, setWorkspacePreferencesLoaded] = useState(false)
  const lastPriceRef = useRef<number>(0)
  const [strategyResult, setStrategyResult] = useState<BacktestResult | null>(null)
  const [strategyError, setStrategyError] = useState<string | null>(null)

  const sourceBadgeText = LIVE_EXCHANGES.has(String(symbol.exchange))
    ? `${String(symbol.exchange)} live feed`
    : 'Unsupported symbol'

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const handlePeriodChange = useCallback((p: Period) => {
    chartRef.current?.setPeriod(p)
    setPeriod(p)
  }, [])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(WORKSPACE_PREFERENCES_KEY) ?? '{}') as Record<string, unknown>
      if (typeof stored.chartType === 'string' && PERSISTED_CHART_TYPES.includes(stored.chartType as ChartType)) setChartType(stored.chartType as ChartType)
      if (isLayoutCount(stored.layoutCount)) setLayoutCount(stored.layoutCount)
      if (typeof stored.syncCrosshair === 'boolean') setSyncCrosshair(stored.syncCrosshair)
      if (typeof stored.syncSymbolPeriod === 'boolean') setSyncSymbolPeriod(stored.syncSymbolPeriod)
    } catch { }
    setWorkspacePreferencesLoaded(true)
  }, [])

  useEffect(() => {
    if (!workspacePreferencesLoaded) return
    try {
      localStorage.setItem(WORKSPACE_PREFERENCES_KEY, JSON.stringify({ chartType, layoutCount, syncCrosshair, syncSymbolPeriod }))
    } catch { }
  }, [chartType, layoutCount, syncCrosshair, syncSymbolPeriod, workspacePreferencesLoaded])

  useEffect(() => {
    if (chartType !== 'heikin_ashi') chartRef.current?.setStyles({ candle: { type: chartType } as never })
  }, [chartType, layoutCount])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const chart = chartRef.current
      if (!chart) return
      if (!undoRef.current) undoRef.current = new UndoManager(chart)
      undoRef.current.record()
      setHistoryVersion(version => version + 1)
    }, 750)
    return () => window.clearInterval(timer)
  }, [])

  const undo = useCallback(() => { if (undoRef.current?.undo()) setHistoryVersion(version => version + 1) }, [])
  const redo = useCallback(() => { if (undoRef.current?.redo()) setHistoryVersion(version => version + 1) }, [])

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
  }, [])

  const toggleVolumeProfile = useCallback(() => {
    const chart = chartRef.current
    if (!chart) return
    if (vpActive) {
      chart.removeIndicator({ name: 'volume_profile' })
      setVpActive(false)
    } else {
      const paneId = chart.createIndicator({ name: 'volume_profile' }, true, { id: 'candle_pane' })
      if (paneId) setVpActive(true)
    }
  }, [vpActive])

  const toggleDOM = useCallback(() => {
    const chart = chartRef.current
    if (!chart) return
    if (domActive) {
      chart.removeIndicator({ name: 'dom' })
      setDomActive(false)
    } else {
      const paneId = chart.createIndicator({ name: 'dom' }, false)
      if (paneId) setDomActive(true)
    }
  }, [domActive])

  const toggleReplay = useCallback(() => {
    setReplayActive(v => !v)
  }, [])

  const handleReplayBars = useCallback(() => {
    chartRef.current?.resetData()
  }, [])

  const togglePattern = useCallback((index: number) => {
    setPatternMask(prev => {
      const next = [...prev]
      next[index] = next[index] === 1 ? 0 : 1
      const anyEnabled = next.some(v => v === 1)
      const chart = chartRef.current
      if (chart) {
        if (anyEnabled && !patternActive) {
          chart.createIndicator({ name: 'patterns', calcParams: next }, true, { id: 'candle_pane' })
          setPatternActive(true)
        } else if (!anyEnabled && patternActive) {
          chart.removeIndicator({ name: 'patterns' })
          setPatternActive(false)
        } else if (patternActive) {
          chart.removeIndicator({ name: 'patterns' })
          chart.createIndicator({ name: 'patterns', calcParams: next }, true, { id: 'candle_pane' })
        }
      }
      return next
    })
  }, [patternActive])

  const openPatternDialog = useCallback(() => {
    setPatternDialogOpen(v => !v)
  }, [])

  const datafeed = useMemo(() => {
    const base = createStandardCryptoDatafeed({ smoothingDuration: 320 })
    const origSubscribe = base.subscribe.bind(base)
    base.subscribe = (sym, per, callback) => {
      const wrapped = (data: CandleData) => {
        lastPriceRef.current = data.close
        AlertManager.getInstance().check({
          indicatorResolver: source => {
            if (source.type !== 'indicator') return undefined
            const h = chartRef.current
            if (!h?.getIndicators) return undefined
            const inds = h.getIndicators({ name: source.name }) as unknown as ChartIndicatorSnapshot[]
            if (!inds || inds.length === 0) return undefined
            const results = inds[0].result
            if (!results || results.length === 0) return undefined
            return results[results.length - 1]?.[source.plot]
          },
          symbol: sym.ticker,
          price: data.close,
          timestamp: data.timestamp as number,
        })
        callback(data)
      }
      origSubscribe(sym, per, wrapped)
    }
    return base
  }, [])

  useEffect(() => {
    const target = window as unknown as { __astroneum?: AstroneumHandle | null }
    const syncHandle = (): void => { target.__astroneum = chartRef.current }
    syncHandle()
    const timer = window.setInterval(() => {
      syncHandle()
      const tz = chartRef.current?.getTimezone?.()
      if (tz) setTimezone(tz)
    }, 500)
    return () => {
      window.clearInterval(timer)
      target.__astroneum = null
    }
  }, [])

  useEffect(() => {
    const onDatafeedError = (event: Event): void => {
      const detail = (event as CustomEvent<DatafeedErrorDetail>).detail
      if (!detail || detail.ticker !== symbol.ticker) return
      setDatafeedError(`[${detail.exchange ?? 'DATA'} ${detail.period}] ${detail.message}`)
    }
    window.addEventListener(DATAFEED_ERROR_EVENT, onDatafeedError)
    return () => window.removeEventListener(DATAFEED_ERROR_EVENT, onDatafeedError)
  }, [symbol.ticker])

  useEffect(() => {
    setDatafeedError(null)
  }, [symbol.ticker, period.text])

  const subIndicatorChips = activeSubIndicators.filter(n => !isOverlay(n))
  const mainIndicatorChips = [
    ...activeMainIndicators,
    ...activeSubIndicators.filter(n => isOverlay(n)),
  ]
  const mainIndicatorDefsFinal = useMemo<IndicatorDef[]>(
    () => mainIndicatorChips.map(name => indicatorDef(name)).filter(Boolean) as IndicatorDef[],
    [mainIndicatorChips]
  )

  // â”€â”€ Topbar content (brand bar â€” the chart's own PeriodBar owns symbol/period/indicators/alert/screenshot/settings) â”€â”€
  const topbar = (
      <WorkspaceToolbar
        leading={<><span className="term-brand">Astroneum</span><span className="term-source-badge">{sourceBadgeText}</span><SaveLoadMenu chartRef={chartRef} /><button className="term-toolbar-icon" onClick={undo} disabled={!undoRef.current?.canUndo} aria-label="Undo" data-history-version={historyVersion}>Undo</button><button className="term-toolbar-icon" onClick={redo} disabled={!undoRef.current?.canRedo} aria-label="Redo">Redo</button></>}
      context={<>
        <button className="term-toolbar-control" onClick={() => chartToolbarRef.current?.openSymbolSearch()}>{symbol.shortName ?? symbol.ticker}</button>
        <div className="term-toolbar-periods">{PRIMARY_PERIODS.map(item => <button key={item.text} className={item.text === period.text ? 'is-active' : ''} onClick={() => handlePeriodChange(item)}>{item.text}</button>)}{OVERFLOW_PERIODS.length > 0 && <IntervalOverflow currentPeriod={period} periods={OVERFLOW_PERIODS} onSelect={handlePeriodChange} />}</div>
        <button className="term-toolbar-control" onClick={() => chartToolbarRef.current?.openIndicators()}>Indicators</button>
        <button className="term-toolbar-icon" onClick={() => chartToolbarRef.current?.openAlert()} aria-label="Create alert">Alert</button>
        <button className="term-toolbar-icon" onClick={() => chartToolbarRef.current?.toggleDrawingBar()} aria-label="Toggle drawing tools">Draw</button>
      </>}
      actions={<>
        <button className="term-toolbar-icon" onClick={() => chartToolbarRef.current?.openTimezone()} aria-label="Timezone">TZ</button>
        <button className="term-toolbar-icon" onClick={() => chartToolbarRef.current?.captureScreenshot()} aria-label="Take screenshot">Shot</button>
        <button className="term-toolbar-icon" onClick={() => chartToolbarRef.current?.openSettings()} aria-label="Chart settings">Settings</button>
      </>}
    >
      {datafeedError && <span className="term-error-badge" title={datafeedError}>{datafeedError}</span>}
      <div className="term-spacer" />
      <button
        className="term-icon-btn"
        onClick={() => setCmdkOpen(true)}
        title="Quick Search (Ctrl+K)"
        aria-label="Quick Search"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      <LayoutPicker value={layoutCount} onChange={setLayoutCount} />
      {layoutCount > 1 && (
        <SyncMenu
          syncCrosshair={syncCrosshair}
          syncSymbolPeriod={syncSymbolPeriod}
          onCrosshairChange={setSyncCrosshair}
          onSymbolPeriodChange={setSyncSymbolPeriod}
        />
      )}
      <div className="term-divider" />
      <button
        className={`term-icon-btn ${replayActive ? 'is-active' : ''}`}
        onClick={toggleReplay}
        title="Bar Replay"
        aria-label="Bar Replay"
        aria-pressed={replayActive}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M3 10a7 7 0 0 1 12-4.9M17 10a7 7 0 0 1-12 4.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M14 3v3h-3M6 17v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <ChartTypeDropdown value={chartType} onChange={handleChartTypeChange} />
      <div className="term-divider" />
      <button
        className={`term-icon-btn ${vpActive ? 'is-active' : ''}`}
        onClick={toggleVolumeProfile}
        title="Volume Profile"
        aria-label="Volume Profile"
        aria-pressed={vpActive}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="8" width="6" height="3" fill="currentColor" rx="0.5"/>
          <rect x="2" y="12" width="10" height="3" fill="currentColor" rx="0.5"/>
          <rect x="2" y="4" width="4" height="3" fill="currentColor" rx="0.5"/>
          <line x1="13" y1="2" x2="13" y2="18" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
        </svg>
      </button>
      <button
        className={`term-icon-btn ${domActive ? 'is-active' : ''}`}
        onClick={toggleDOM}
        title="Depth of Market"
        aria-label="Depth of Market"
        aria-pressed={domActive}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect x="12" y="4" width="6" height="2" fill="#26a69a" rx="0.5"/>
          <rect x="10" y="7" width="8" height="2" fill="#26a69a" rx="0.5"/>
          <rect x="12" y="10" width="6" height="2" fill="#26a69a" rx="0.5"/>
          <rect x="2" y="4" width="4" height="2" fill="#ef5350" rx="0.5"/>
          <rect x="2" y="7" width="6" height="2" fill="#ef5350" rx="0.5"/>
          <rect x="2" y="10" width="3" height="2" fill="#ef5350" rx="0.5"/>
          <line x1="10" y1="2" x2="10" y2="16" stroke="currentColor" strokeWidth="0.8"/>
        </svg>
      </button>
      <div className="term-divider" />
      <button
        className={`term-icon-btn ${patternActive ? 'is-active' : ''}`}
        onClick={openPatternDialog}
        title="Candlestick Patterns"
        aria-label="Candlestick Patterns"
        aria-pressed={patternActive}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="7" width="3" height="6" fill="currentColor" rx="0.5"/>
          <line x1="4.5" y1="5" x2="4.5" y2="7" stroke="currentColor" strokeWidth="0.8"/>
          <line x1="4.5" y1="13" x2="4.5" y2="15" stroke="currentColor" strokeWidth="0.8"/>
          <rect x="8" y="5" width="3" height="8" fill="currentColor" rx="0.5"/>
          <line x1="9.5" y1="3" x2="9.5" y2="5" stroke="currentColor" strokeWidth="0.8"/>
          <line x1="9.5" y1="13" x2="9.5" y2="17" stroke="currentColor" strokeWidth="0.8"/>
          <circle cx="16" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1"/>
        </svg>
      </button>
      <button className="term-icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} aria-label="Toggle theme">
        {theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        )}
      </button>
    </WorkspaceToolbar>
  )

  // â”€â”€ Chart cell â€” single or multi-chart depending on layout selection â”€â”€
  const chartCell = (
    <div className="term-chart-canvas">
      {replayActive && layoutCount === 1 && (
        <ReplayToolbar
          datafeed={datafeed}
          symbol={symbol}
          period={period}
          onReplayBars={handleReplayBars}
          onClose={() => setReplayActive(false)}
        />
      )}
      {layoutCount === 1 ? (
        <AstroneumChart
          ref={chartRef}
          toolbarActionsRef={chartToolbarRef}
          toolbarVisible={false}
          symbol={symbol}
          period={period}
          periods={PERIODS}
          datafeed={datafeed}
          theme={theme}
          drawingBarVisible
          initialHistory="all"
          watermark={`${symbol.ticker} Â· ${period.text}`}
          barStyle={chartType === 'heikin_ashi' ? 'heikin_ashi' : 'candle'}
          mainIndicators={mainIndicatorDefsFinal}
          subIndicators={subIndicatorChips}
          plugins={rangeNavPlugin}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <MultiChartView
          datafeed={datafeed}
          symbol={symbol}
          period={period}
          periods={PERIODS}
          theme={theme}
          chartType={chartType}
          count={layoutCount}
          syncCrosshair={syncCrosshair}
          syncSymbolPeriod={syncSymbolPeriod}
        />
      )}
    </div>
  )

  const handleWatchlistSelect = useCallback((ticker: string) => {
    const sym = STANDARD_CRYPTO_SYMBOLS.find(s => s.ticker === ticker)
    if (sym) {
      setSymbol(sym)
      chartRef.current?.setSymbol(sym)
    }
  }, [])

  const handleSymbolSelect = useCallback((sym: SymbolInfo) => {
    setSymbol(sym)
    chartRef.current?.setSymbol(sym)
  }, [])

  const handlePineCompiled = useCallback((name: string) => {
    void name
  }, [])

  const handleStrategyCompiled = useCallback((strategy: CompiledStrategy) => {
    const bars = chartRef.current?.getDataList() ?? []
    if (bars.length === 0) {
      setStrategyResult(null)
      setStrategyError('Chart history is still loading. Try again when candles are visible.')
      return
    }
    try {
      setStrategyResult(strategy.run(bars))
      setStrategyError(null)
    } catch (error) {
      setStrategyResult(null)
      setStrategyError((error as Error).message)
    }
  }, [])

  const getIndicatorSources = useCallback((): IndicatorSourceOption[] => {
    const h = chartRef.current
    if (!h?.getIndicators) return []
    const indicators = h.getIndicators() as unknown as ChartIndicatorSnapshot[]
    return indicators.flatMap(ind => (ind.figures ?? []).map(figure => ({
      paneId: ind.paneId ?? '',
      name: ind.name,
      plot: figure.key,
      shortName: ind.shortName ?? ind.name,
    })))
  }, [])

  // Ctrl+K â€” toggle command palette (demo-level hotkey)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setCmdkOpen(v => !v)
        return
      }
      if (e.key === ',') {
        const currentIndex = PERIODS.findIndex(p => p.text === period.text)
        if (currentIndex >= 0) handlePeriodChange(PERIODS[(currentIndex + 1) % PERIODS.length])
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [redo, undo, period])

  return (
    <LayerProvider>
      <ChartLayerProvider>
        <WorkspaceShell
          theme={theme}
          storageKey="astroneum-demo-workspace-shell"
          toolbar={topbar}
          sidebar={<SidebarContent onSymbolSelect={handleWatchlistSelect} selectedTicker={symbol.ticker} symbol={symbol} datafeed={datafeed} getCurrentPrice={() => lastPriceRef.current} getIndicatorSources={getIndicatorSources} />}
          dock={<DockContent onPineCompiled={handlePineCompiled} onStrategyCompiled={handleStrategyCompiled} result={strategyResult} strategyError={strategyError} />}
          footer={<DateRangeNavigator engine={chartEngine} symbol={symbol.ticker} timezone={timezone} />}
        >
          {chartCell}
          {patternDialogOpen && (
            <PatternDialog
              enabledMask={patternMask}
              onToggle={togglePattern}
              onClose={() => setPatternDialogOpen(false)}
            />
          )}
          <CommandPalette
            open={cmdkOpen}
            onClose={() => setCmdkOpen(false)}
            onSymbolSelect={handleSymbolSelect}
            onPeriodChange={handlePeriodChange}
            onToggleTheme={toggleTheme}
            onToggleReplay={toggleReplay}
            onToggleVolumeProfile={toggleVolumeProfile}
            onToggleDOM={toggleDOM}
            onTogglePatterns={openPatternDialog}
            periods={PERIODS}
            currentSymbol={symbol.ticker}
            currentPeriod={period.text}
          />
        </WorkspaceShell>
      </ChartLayerProvider>
    </LayerProvider>
  )
}
