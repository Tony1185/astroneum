import {
  registerIndicator,
  getSupportedIndicators,
  registerOverlay,
  getSupportedOverlays,
  registerXAxis,
  registerYAxis
} from '@/engine'

import overlays from './extension'

import DefaultDatafeed from './datafeed'
import { WebSocketDatafeed } from './datafeed/WebSocketDatafeed'
import AstroneumChart from './chart'
import MultiChartLayout from './chart/MultiChartLayout'
import BarReplay from './chart/BarReplay'
import DrawingTemplates from './chart/DrawingTemplates'
import AlertManager from './chart/AlertManager'
import ScriptEngine from './scripting/ScriptEngine'
import WatchlistManager from './chart/WatchlistManager'
import PortfolioTracker from './chart/PortfolioTracker'
import PerformanceMode from './chart/PerformanceMode'
import { AlertModal, SymbolSearchModal } from './widget'

import { load, loadLocale, BUILTIN_LOCALES } from './i18n'
import {
  formatPrice,
  formatVolume,
  formatPercent,
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
  formatPeriod,
  detectPricePrecision
} from './i18n/format'

import {
  createIndicatorTemplateFromPlugin,
  registerIndicatorPlugin,
  registerIndicatorPlugins
} from './plugin'
import {
  DATAFEED_ERROR_EVENT,
  STANDARD_CRYPTO_SYMBOLS,
  BinanceAdapter,
  BitgetAdapter,
  OkxAdapter,
  StandardCryptoDatafeed,
  createStandardCryptoDatafeed,
} from './datafeed/StandardCryptoDatafeed'

import {
  type Datafeed,
  type SymbolInfo,
  type Period,
  type DatafeedSubscribeCallback,
  type QuoteSnapshot,
  type AstroneumOptions,
  type AstroneumHandle,
  type SerializedChartState,
  type CandleData,
  type ChartPlugin,
  type ChartPluginContext,
  type ChartToolbarActions
} from './types'

overlays.forEach(o => { registerOverlay(o) })

export {
  DefaultDatafeed,
  WebSocketDatafeed,
  AstroneumChart,
  MultiChartLayout,
  BarReplay,
  DrawingTemplates,
  AlertManager,
  ScriptEngine,
  WatchlistManager,
  PortfolioTracker,
  PerformanceMode,
  AlertModal,
  SymbolSearchModal,
  load as loadLocales,
  loadLocale,
  BUILTIN_LOCALES,
  formatPrice,
  formatVolume,
  formatPercent,
  formatDate,
  formatTime,
  formatDateTime,
  formatDuration,
  formatPeriod,
  detectPricePrecision,
  registerIndicator,
  getSupportedIndicators,
  registerOverlay,
  getSupportedOverlays,
  registerXAxis,
  registerYAxis,
  createIndicatorTemplateFromPlugin,
  registerIndicatorPlugin,
  registerIndicatorPlugins,
  DATAFEED_ERROR_EVENT,
  STANDARD_CRYPTO_SYMBOLS,
  BinanceAdapter,
  BitgetAdapter,
  OkxAdapter,
  StandardCryptoDatafeed,
  createStandardCryptoDatafeed
}

export { asPrice, asVolume, asTimestamp, rafCoalesce, rafMergeTick, deepSet, deepClone } from './utils'
export { EventBus } from './chart/EventBus'
export { TickAnimator } from './engine/common/TickAnimator'
export { RingBuffer } from './engine/common/RingBuffer'

export type {
  Datafeed, SymbolInfo, Period, DatafeedSubscribeCallback, QuoteSnapshot, AstroneumOptions, AstroneumHandle, CandleData,
  ChartPlugin, ChartPluginContext, ChartToolbarActions, SerializedChartState
}
export type { Viewport, IndicatorPlugin, ChartEventMap, Price, Volume, Timestamp } from './types'
// Note: CSS is shipped as a separate artifact (`astroneum/style.css`) built from
// src/styles/index.scss. It is intentionally NOT side-imported from the JS entry
// so the bundle stays style-free for consumers that import the CSS themselves.
export type { TickAnimatorOptions } from './engine/common/TickAnimator'
export type { WebSocketDatafeedOptions } from './datafeed/WebSocketDatafeed'
export type {
  CryptoSymbolInfo,
  DatafeedErrorDetail,
  DatafeedErrorType,
  ExchangeAdapter,
  StandardCryptoDatafeedOptions,
} from './datafeed/StandardCryptoDatafeed'

export type { MultiChartCount, MultiChartSlot, MultiChartLayoutOptions } from './chart/MultiChartLayout'
export type { BarReplayOptions, BarReplayState } from './chart/BarReplay'
export type { OverlayStylePreset, DrawingStyleTemplate } from './chart/DrawingTemplates'
export type { Alert, AlertCondition, AlertOperator, AlertConditionDef, AlertSource, AlertStatus, AlertFrequency, AlertCreate, AlertCheckInput, AlertTriggeredCallback, AlertChangeCallback, SoundTitle, SoundDuration, NotificationSchedule, WebhookStatus } from './chart/AlertManager'
export type { FormatPriceOptions, DateFormatStyle, TimeFormatStyle } from './i18n/format'
export type { CompiledIndicator, CompiledStrategy, StudyOptions, PlotOptions, InputOptions } from './scripting/ScriptEngine'
export type { Watchlist, WatchSymbol, WatchlistColumn, WatchlistSort, WatchlistSortDirection } from './chart/WatchlistManager'
export type { IndicatorSourceOption } from './widget'
export type { SymbolSearchModalProps } from './widget/symbol-search-modal'
export type { Position, PositionSide, PnLResult } from './chart/PortfolioTracker'
export type { Bar as PerformanceBar } from './chart/PerformanceMode'
export type {
  BacktestConfig,
  BacktestMetrics,
  BacktestResult,
  BacktestTrade,
  EquityPoint,
  StrategySide,
} from './strategy'
export { heikinAshi } from './chart/PerformanceMode'
export { runBacktest } from './strategy'
export type { StrategySignal } from './strategy'
export { UndoManager } from './chart/UndoManager'
export { SessionVisualizer } from './chart/SessionVisualizer'
export type { SessionConfig } from './chart/SessionVisualizer'
export { volumeProfilePlugin } from './chart/VolumeProfilePlugin'
export type { VolumeProfileRow } from './chart/VolumeProfilePlugin'
export { ChartTemplateManager } from './chart/ChartTemplateManager'
export type { ChartTemplate } from './chart/ChartTemplateManager'
export { resampleBars, forwardFill, mtfIndicator } from './chart/MultiTimeframe'
export { PositionVisualizer, type PositionVisual } from './chart/PositionVisualizer'
export { zigzag, detectSupportResistance, zigzagPlugin } from './chart/ZigzagPattern'
export { patternRecognitionPlugin, PATTERN_CATALOGUE } from './chart/PatternRecognition'
export type { PatternDef, PatternMatch } from './chart/PatternRecognition'
export { MultiPeriodLayout, type MultiPeriodLayoutOptions } from './chart/MultiPeriodLayout'
export { createCompareIndicator, type CompareIndicatorOptions } from './chart/CompareOverlay'
export { domPlugin, type DOMLevel } from './chart/DOMPane'
export { transformCandles, untransformPrice, formatScaleTick, type PriceScaleMode } from './chart/PriceScaleTransform'
export { generateRenko, generateKagi, generateTickBars, generateRangeBars } from './chart/NonTimeBars'
export { generatePointAndFigure, computePFColumns, pfColumnsToBars, pointAndFigurePlugin, type PFConfig, type PFColumn } from './chart/PointAndFigure'
