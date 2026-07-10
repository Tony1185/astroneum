'use client'

import 'astroneum/style.css'
import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import {
  AstroneumChart,
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
  type SymbolInfo,
  type Period,
  type CandleData,
} from '@tony01/astroneum'
import { AlertManager } from '@tony01/astroneum'
import TerminalShell, { useTerminalShell } from './TerminalShell'
import WatchlistPanel, { AlertsPanel } from './panels/WatchlistPanel'
import PineEditorPanel, { StrategyTesterPanel, TradingPanel, StubPanel } from './panels/PineEditorPanel'
import DateRangeNavigator from './DateRangeNavigator'
import CommandPalette from './CommandPalette'
import ChartTypeDropdown, { type ChartType } from './ChartTypeDropdown'
import ReplayToolbar from './ReplayToolbar'
import PatternDialog from './PatternDialog'
import MultiChartView, { LayoutPicker, SyncMenu } from './MultiChartView'

// Register pro indicator plugins once at module load
registerIndicatorPlugin(volumeProfilePlugin)
registerIndicatorPlugin(domPlugin)
registerIndicatorPlugin(patternRecognitionPlugin)

interface IndicatorDef {
  name: string
  calcParams?: number[]
}

const PERIODS: Period[] = [
  { multiplier: 1, timespan: 'minute', text: '1m' },
  { multiplier: 5, timespan: 'minute', text: '5m' },
  { multiplier: 15, timespan: 'minute', text: '15m' },
  { multiplier: 1, timespan: 'hour', text: '1H' },
  { multiplier: 4, timespan: 'hour', text: '4H' },
  { multiplier: 1, timespan: 'day', text: 'D' },
  { multiplier: 1, timespan: 'week', text: 'W' },
]

const LIVE_EXCHANGES = new Set(['BINANCE', 'BINANCE_SPOT', 'BITGET', 'OKX'])

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
  Cursor: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 3l12 7-5 1 3 6-2 1-3-6-4 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
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
  Data: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Strategy: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 16l5-6 4 4 7-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Pine: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 7l-4 8h4l-2 4h6l-2-4h4l-4-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
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

// â”€â”€ Rail content (Phase 1 placeholder â€” Phase 3 fills with DrawingBar + toggles) â”€â”€
function RailContent() {
  const [active, setActive] = useState('cursor')
  return (
    <>
      <div className="term-rail-group">
        <button className={`term-rail-item ${active === 'cursor' ? 'is-active' : ''}`} onClick={() => setActive('cursor')} title="Cursor / Object Selection (Esc)">
          <Icon.Cursor />
        </button>
      </div>
      <div className="term-rail-divider" />
      <div className="term-rail-group">
        <button className={`term-rail-item ${active === 'watchlist' ? 'is-active' : ''}`} onClick={() => setActive('watchlist')} title="Watchlist">
          <Icon.Watchlist />
        </button>
        <button className={`term-rail-item ${active === 'alerts' ? 'is-active' : ''}`} onClick={() => setActive('alerts')} title="Alerts">
          <Icon.Alert />
        </button>
        <button className={`term-rail-item ${active === 'data' ? 'is-active' : ''}`} onClick={() => setActive('data')} title="Data Window">
          <Icon.Data />
        </button>
        <button className={`term-rail-item ${active === 'strategy' ? 'is-active' : ''}`} onClick={() => setActive('strategy')} title="Strategy Tester">
          <Icon.Strategy />
        </button>
        <button className={`term-rail-item ${active === 'pine' ? 'is-active' : ''}`} onClick={() => setActive('pine')} title="Pine Editor">
          <Icon.Pine />
        </button>
        <button className={`term-rail-item ${active === 'trading' ? 'is-active' : ''}`} onClick={() => setActive('trading')} title="Trading Panel">
          <Icon.Trading />
        </button>
      </div>
    </>
  )
}

// â”€â”€ Sidebar content (Phase 1 placeholder â€” Phase 3 fills with WatchlistWidget etc.) â”€â”€
const SIDEBAR_TABS = [
  { id: 'watchlist', label: 'Watchlist', icon: Icon.Watchlist },
  { id: 'details', label: 'Details', icon: Icon.Details },
  { id: 'alerts', label: 'Alerts', icon: Icon.Alert },
  { id: 'calendar', label: 'Calendar', icon: Icon.Calendar },
  { id: 'news', label: 'News', icon: Icon.News },
  { id: 'ideas', label: 'Ideas', icon: Icon.Ideas },
  { id: 'trading', label: 'Trading', icon: Icon.Trading },
] as const

function SidebarContent({ onSymbolSelect, selectedTicker, symbol, getCurrentPrice }: { onSymbolSelect?: (t: string) => void; selectedTicker?: string; symbol?: string; getCurrentPrice?: () => number | undefined }) {
  const [active, setActive] = useState('watchlist')
  const activeTab = SIDEBAR_TABS.find(t => t.id === active)

  const renderPanel = () => {
    switch (active) {
      case 'watchlist':
        return <WatchlistPanel onSymbolSelect={onSymbolSelect} selectedTicker={selectedTicker} />
      case 'alerts':
        return <AlertsPanel symbol={symbol} getCurrentPrice={getCurrentPrice} />
      case 'details':
        return <StubPanel title="Details" icon="â„¹" hint="Fundamentals for the active symbol â€” wired when a fundamentals datafeed is connected" />
      case 'calendar':
        return <StubPanel title="Calendar" icon="ðŸ“…" hint="Economic calendar events â€” wired when an economic data feed is connected" />
      case 'news':
        return <StubPanel title="News" icon="ðŸ“°" hint="News feed filtered to the active symbol â€” wired when a news feed is connected" />
      case 'ideas':
        return <StubPanel title="Ideas" icon="ðŸ’¡" hint="Published community ideas â€” wired when an ideas API is connected" />
      case 'trading':
        return <StubPanel title="Trading" icon="ðŸ’¼" hint="Connect a broker to place orders and track positions" />
      default:
        return null
    }
  }

  return (
    <>
      <div className="term-sidebar-strip">
        {SIDEBAR_TABS.map(tab => {
          const IconComp = tab.icon
          return (
            <button
              key={tab.id}
              className={`term-sidebar-tab ${active === tab.id ? 'is-active' : ''}`}
              onClick={() => setActive(tab.id)}
              title={tab.label}
            >
              <IconComp />
              <span className="term-sidebar-tab-label">{tab.label}</span>
            </button>
          )
        })}
      </div>
      <div className="term-sidebar-body">
        <div className="term-sidebar-header">
          <span className="term-sidebar-title">{activeTab?.label ?? ''}</span>
        </div>
        <div className="term-sidebar-content">
          {renderPanel()}
        </div>
      </div>
    </>
  )
}

// â”€â”€ Dock content (Phase 1 placeholder â€” Phase 3 fills with Pine Editor etc.) â”€â”€
const DOCK_TABS = ['Pine Editor', 'Strategy Tester', 'Trading Panel'] as const

function DockContent({ onPineCompiled }: { onPineCompiled?: (name: string) => void }) {
  const { dockOpen, toggleDock } = useTerminalShell()
  const [active, setActive] = useState(0)

  const renderDockBody = () => {
    switch (active) {
      case 0:
        return <PineEditorPanel onCompiled={onPineCompiled} />
      case 1:
        return <StrategyTesterPanel />
      case 2:
        return <TradingPanel />
      default:
        return null
    }
  }

  return (
    <>
      <div className="term-dock-tabs">
        {DOCK_TABS.map((label, i) => (
          <button
            key={label}
            className={`term-dock-tab ${active === i ? 'is-active' : ''}`}
            onClick={() => { setActive(i); if (!dockOpen) toggleDock() }}
          >
            {label}
          </button>
        ))}
        <div className="term-dock-controls">
          <button className="term-icon-btn" onClick={toggleDock} title={dockOpen ? 'Minimize' : 'Expand'}>
            {dockOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      {dockOpen && (
        <div className="term-dock-body">
          {renderDockBody()}
        </div>
      )}
    </>
  )
}

// â”€â”€ Chart engine bridge â”€â”€
// <AstroneumChart> exposes AstroneumHandle, but the date-range navigator needs
// the full engine (scrollToRealTime / zoomAtDataIndex / getVisibleRange). A
// ChartPlugin captures it in onInit and hands it to React state. This is the
// library-blessed extension path â€” no forking (see design-astroneum.md Â§9).
type ChartEngine = ChartPluginContext['chart']

// â”€â”€ Main terminal component â”€â”€
export default function ChartTerminal() {
  const chartRef = useRef<AstroneumHandle>(null)
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

  const [symbol] = useState<SymbolInfo>(symbols[0])
  const [period, setPeriod] = useState<Period>(PERIODS[0])
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [activeSubIndicators] = useState<string[]>(['VOL'])
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
  const lastPriceRef = useRef<number>(0)

  const sourceBadgeText = LIVE_EXCHANGES.has(String(symbol.exchange))
    ? `${String(symbol.exchange)} live feed`
    : 'Unsupported symbol'

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
    if (type === 'heikin_ashi') {
      // Heikin-Ashi is a barStyle prop change (data transform), not a styles change
      // The chart re-renders with barStyle='heikin_ashi' via the prop below
    } else {
      // Standard candle types are styles changes â€” apply via handle
      chartRef.current?.setStyles({ candle: { type } as never })
    }
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
    <>
      <span className="term-brand">Astroneum</span>
      <span className="term-source-badge">{sourceBadgeText}</span>
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
    </>
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
          count={layoutCount}
          syncCrosshair={syncCrosshair}
          syncSymbolPeriod={syncSymbolPeriod}
        />
      )}
    </div>
  )

  const handleWatchlistSelect = useCallback((ticker: string) => {
    const sym = STANDARD_CRYPTO_SYMBOLS.find(s => s.ticker === ticker)
    if (sym) chartRef.current?.setSymbol(sym)
  }, [])

  const handleSymbolSelect = useCallback((sym: SymbolInfo) => {
    chartRef.current?.setSymbol(sym)
  }, [])

  const handlePeriodChange = useCallback((p: Period) => {
    chartRef.current?.setPeriod(p)
    setPeriod(p)
  }, [])

  const handlePineCompiled = useCallback((name: string) => {
    void name
  }, [])

  // Ctrl+K â€” toggle command palette (demo-level hotkey)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setCmdkOpen(v => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <TerminalShell
      theme={theme}
      topbar={topbar}
      rail={<RailContent />}
      sidebar={<SidebarContent onSymbolSelect={handleWatchlistSelect} selectedTicker={symbol.ticker} symbol={symbol.ticker} getCurrentPrice={() => lastPriceRef.current} />}
      dock={<DockContent onPineCompiled={handlePineCompiled} />}
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
    </TerminalShell>
  )
}
