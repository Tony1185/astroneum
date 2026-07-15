# TradingView Functions → Astroneum Mirror Map

> Source of truth for "which TradingView feature maps to what in Astroneum." Consult before building anything in `/astroneum`. Webhook + Pine + strategy-report sections are grounded in the v21 Pine source (`BTC H4 OP v21 WH+ LIVE`, title `CTC BB·SMMA H4 v2.9 + Webhook (Live-Ready)`).
>
> **Last verified against:** TradingView Super Chart (Jul 2026) + Pine v5.
> **Companion docs:** `docs/design-astroneum.md` (UX spec), `docs/webhook-payloads.md` (v14, stale — see §8).

---

## 1. Mirror status taxonomy

Every catalog row carries one of these six statuses. The status dictates what to do when the function is touched in `/astroneum`.

| Bucket | Meaning | Action |
|---|---|---|
| `widget-native` | The Astroneum library/component already provides it | Use the existing prop, method, manager, plugin, or widget; do not rebuild |
| `native-chrome` | Astroneum rebuilds it in surrounding chrome | Build per `docs/design-astroneum.md` §5 |
| `api-bridged` | Existing backend API already mirrors it | Reuse; do not rebuild |
| `v1-in-scope` | Spec'd for v1 per `design-astroneum.md` §11 | Build now |
| `v1-deferred` | Explicitly out of scope per `design-astroneum.md` §12 | Do not build; list for v2 |
| `v2-future` | Not yet spec'd | Note only; no action |

---

## 2. Existing Astroneum API surface

Astroneum is a **SEPARATE project** from Trading-Bot-V2 (different repo: `github.com/kowito/astroneum` vs `github.com/Tony1185/trading-bot-v2.git`). The Astroneum demo app (`/opt/astroneum/demo/`, the `astroneum-demo-next` Next.js app) is charting-first and has a minimal API surface. Trading-Bot-V2's webhook/positions/orders APIs are NOT available to Astroneum.

### Astroneum demo app API routes (api-bridged)

| Path / file | Role |
|---|---|
| `/opt/astroneum/demo/src/app/api/alerts/email/route.ts` | The only API route. Sends alert email notifications. |

### Astroneum library modules (astroneum-native, not API routes)

These are client-side library modules from the `astroneum` npm package, not server API routes:

| Subpath | Role |
|---|---|
| `astroneum/alerts` | `AlertManager` — price alert creation and monitoring (client-side). |
| `astroneum/portfolio` | `PortfolioTracker` — position tracking and P&L (read-only display; not an execution path). |
| `astroneum/watchlist` | `WatchlistManager` — symbol watchlist with live prices. |
| `astroneum/datafeeds/crypto` | `createStandardCryptoDatafeed` + `BinanceAdapter` / `BitgetAdapter` / `OkxAdapter` — real-time crypto data. |

### Trading-Bot-V2 API surface (SEPARATE project — NOT available to Astroneum)

The following are in the Trading-Bot-V2 project (`/root/Trading-Bot-V2/` or `/opt/trading-bot-v2/`) and are NOT importable by Astroneum. Listed here for reference only — if Astroneum needs equivalent functionality, build new API routes in `/opt/astroneum/demo/src/app/api/`:

| Trading-Bot-V2 path | Role | Astroneum equivalent |
|---|---|---|
| `src/app/api/webhooks/tradingview/route.ts` | Ingests TV `alert()` POSTs (5 actions). | None — Astroneum has no webhook ingestion. v21 events are reference-only (see §3.12). |
| `src/app/api/tv-positions/route.ts` | TV-reported positions. | None — use `astroneum/portfolio` `PortfolioTracker` for read-only display. |
| `src/app/api/orders/route.ts` | Order creation (PaperTradingEngine + RiskManager). | None — Astroneum is charting-first; build new if trading is needed. |
| `src/app/api/portfolio/route.ts` | Portfolio summary. | None — use `astroneum/portfolio` `PortfolioTracker`. |
| `src/app/api/integrations/tradingview/route.ts` | Webhook token management. | None — not applicable to Astroneum. |

---

## 3. TV feature catalog (exhaustive, function-level)

Row format: `| Function | TV behavior | Status | Pointer | Notes |`. Pointer = where Astroneum implements or will implement it. `—` = no pointer yet.

### 3.1 Chart types

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Candles | OHLC candle body + wick | `widget-native` | `AstroneumChart` `barStyle` / `ChartTypeDropdown` | v21 uses candles |
| Hollow Candles | Body hollow on up | `v1-deferred` | ? | Not exposed in current demo selector |
| Heikin Ashi | HA-transformed candles | `widget-native` | `AstroneumChart` `barStyle="heikin_ashi"` / `ChartTypeDropdown` | |
| Line | Close-price line | `widget-native` | `style:"2"` | |
| Area | Line + fill | `widget-native` | `style:"3"` | |
| Baseline | Line vs baseline threshold | `widget-native` | `style:"10"` | |
| Renko | Price-brick, time-independent | `widget-native` | `style:"4"` | |
| Kagi | Line-break reversal | `widget-native` | `style:"5"` | |
| Point & Figure | X/O columns | `widget-native` | `style:"6"` | |
| Line Break | N-line reversal | `widget-native` | `style:"7"` | |
| Range | Range-bars | `widget-native` | `style:"12"` | |
| Chart-type selector | Top-bar dropdown | `native-chrome` | `demo/src/app/components/ChartTypeDropdown.tsx` | Mirrors TV top-bar |

### 3.2 Timeframes

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| 1s, 1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W, 1M | Standard resolutions | `widget-native` | `AstroneumChart` `period` prop + `setPeriod()` | v21 runs on 4h |
| Range bars | Price-range aggregation | `widget-native` | `NonTimeBars` | |
| Custom seconds/minutes | User-defined | `v1-deferred` | — | §12 |
| Timeframe selector | Top-bar buttons | `native-chrome` | `src/widget/period-bar` | Period buttons shipped; overflow dropdown + `,` hotkey remain a TODO-DESIGN gap |

### 3.3 Chart layouts / multi-chart

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Single pane | One chart | `widget-native` | `AstroneumChart` default | |
| 2×1, 1×2, 2×2, 4×2, 4×4 grids | Multi-pane | `native-chrome` | `MultiChartLayout`, `MultiChartView` | each pane restores its own serialized chart state |
| Sync crosshair across panes | Linked | `native-chrome` | `MultiChartLayout` | toggle persisted with the workspace |
| Layout selector | Grid picker | `native-chrome` | `LayoutPicker` | grid selection persisted with chart type |

### 3.4 Scales

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Regular scale | Linear price | `widget-native` | | |
| Logarithmic | Log price | `widget-native` | | |
| Percentage | % from baseline | `widget-native` | | |
| Auto-scale | Fit-to-screen | `widget-native` | | |

### 3.5 Compare / overlay / spread

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Compare symbol | Overlay another ticker | `v1-deferred` | — | §12; widget supports internally |
| Spread chart | A−B / ratio | `v1-deferred` | — | |
| Same-scale overlay | Pin to existing axis | `v1-deferred` | — | |

### 3.6 Built-in indicators (~40 key; 100+ total in TV)

v21 uses: BB, SMMA (RMA), SAR, ADX/DI, MACD, RSI, ATR, EMA(1D), Choppiness Index (custom), Volume MA. Status `widget-native` for all — added via `studies` array or the indicators menu.

| Indicator | TV behavior | Status | Pointer | v21 uses? |
|---|---|---|---|---|
| Moving Average (SMA) | `ta.sma` | `widget-native` | studies | no (uses SMMA=RMA) |
| Moving Average Exponential (EMA) | `ta.ema` | `widget-native` | studies | yes (1D macro filter) |
| Moving Average Weighted (WMA) | `ta.wma` | `widget-native` | studies | no |
| Moving Average Smoothed (RMA/SMMA) | `ta.rma` | `widget-native` | studies | yes (fast/slow trend) |
| Bollinger Bands | `ta.stdev` bands | `widget-native` | studies | yes |
| Bollinger Bands %B | % of band | `widget-native` | studies | no |
| Relative Strength Index (RSI) | `ta.rsi` | `widget-native` | studies | yes (mom decay) |
| MACD | `ta.macd` | `widget-native` | studies | yes (filter + mom) |
| Average True Range (ATR) | `ta.atr` | `widget-native` | studies | yes (trail SL) |
| Parabolic SAR | `ta.sar` | `widget-native` | studies | yes |
| Average Directional Index (ADX/DI) | `ta.dmi` | `widget-native` | studies | yes (decay + entry filter) |
| Stochastic | %K/%D | `widget-native` | studies | no |
| Stochastic RSI | Stoch of RSI | `widget-native` | studies | no |
| Commodity Channel Index (CCI) | `ta.cci` | `widget-native` | studies | no |
| Williams %R | `ta.wpr` | `widget-native` | studies | no |
| Money Flow Index (MFI) | `ta.mfi` | `widget-native` | studies | no |
| On-Balance Volume (OBV) | `ta.obv` | `widget-native` | studies | no |
| Volume | Volume bars | `widget-native` | studies | yes (vol-spike exit) |
| Volume MA | SMA of volume | `widget-native` | studies | yes (`ta.sma(volume,...)`) |
| Volume Profile (VPVR) | Price-volume histogram | `widget-native` | studies | no |
| VWAP | `ta.vwap` | `widget-native` | studies | no |
| Ichimoku Cloud | Tenken/Kijun/Span | `widget-native` | studies | no |
| Hull Moving Average | `ta.hma` | `widget-native` | studies | no |
| Donchian Channels | `ta.donchian` | `widget-native` | studies | no |
| Pivot Points High/Low | `ta.pivothigh`/`pivotlow` | `widget-native` | studies | yes (HH/LL detection) |
| Zig Zag | Swing marker | `widget-native` | studies | no |
| Elliott Wave | Manual annotation | `widget-native` | studies | no |
| Gann Box / Fan / Complex | Gann tools | `widget-native` | studies | no |
| Fibonacci Retracement | Fib levels | `widget-native` | studies | no (drawing tool used instead) |
| Choppiness Index | `math.log10`-based | `widget-native` | studies | yes (custom impl, regime filter) |
| Supertrend | ATR band | `widget-native` | studies | no |
| Keltner Channels | ATR bands | `widget-native` | studies | no |
| Williams Fractal | Swing highs/lows | `widget-native` | studies | no |
| Momentum | `ta.mom` | `widget-native` | studies | no |
| Rate of Change (ROC) | `ta.roc` | `widget-native` | studies | no |
| Awesome Oscillator | `ta.ao` | `widget-native` | studies | no |
| Accelerator Oscillator | AO of AO | `widget-native` | studies | no |
| Cumulative Volume Index | CVI | `widget-native` | studies | no |
| Advance/Decline Line | A/D | `widget-native` | studies | no |
| ... 60+ more | see TV indicators dialog | `widget-native` | studies | n/a |

### 3.7 Pine custom indicators

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Load Pine indicator | `Add to chart` from community | `widget-native` | | |
| Author Pine indicator | Pine Editor | `v1-deferred` | — | §12 (native Pine Editor out of scope) |

### 3.8 Indicator templates

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Save indicator template | Preset of inputs + style | `v1-deferred` | — | |
| Apply template | One-click | `v1-deferred` | — | |

### 3.9 Indicator settings dialog

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Inputs tab | Length, source, params | `v1-deferred` | ? | `IndicatorSettingModal` is partial; full Inputs/Style/Visibility parity remains deferred |
| Style tab | Color, width, plot visibility | `v1-deferred` | — | |
| Visibility tab | Per-timeframe show/hide | `v1-deferred` | — | |

### 3.10 Drawing tools (~50)

Astroneum ships a left vertical toolbar (`src/widget/drawing-bar`) mirroring TV's drawing-tool dock. Drawing primitives live under `src/extension/` (32 overlays); the library owns the rail and the demo shell preserves it through the dock height, with internal scrolling on short viewports only (`@media max-height:620px`).

| Tool | TV behavior | Status | Pointer |
|---|---|---|---|
| Cursor / pointer | Default select | `native-chrome` | `src/widget/drawing-bar` |
| Trend line | Two-point line | `widget-native` | `src/extension` |
| Horizontal line | Price level | `widget-native` | |
| Vertical line | Time marker | `widget-native` | |
| Fibonacci retracement | Fib levels | `widget-native` | |
| Fibonacci extension | Fib projection | `widget-native` | |
| Fibonacci time zones | Time fib | `widget-native` | |
| Fibonacci fan / arcs / spiral / channel | Fib variants | `widget-native` | |
| Gann box / fan / complex / squares | Gann tools | `widget-native` | |
| Rectangle | Box shape | `widget-native` | |
| Ellipse | Oval | `widget-native` | |
| Triangle / polygon / arrow | Shapes | `widget-native` | |
| Long position | Risk/reward entry to stop to target | `native-chrome` | `src/extension/longPosition` |
| Short position | Inverted risk/reward | `native-chrome` | `src/extension/shortPosition` |
| Position forecast | Projection cone | `native-chrome` | `src/extension/positionForecast` |
| Bars pattern | Replay candles at new position | `native-chrome` | `src/extension/barsPattern` |
| Ghost feed | Translucent candle copy | `native-chrome` | `src/extension/ghostFeed` |
| Sector | Arc/fan from pivot | `native-chrome` | `src/extension/sector` |
| Anchored VWAP | Cumulative VWAP from anchor | `native-chrome` | `src/extension/anchoredVwap` |
| Fixed range volume profile | Horizontal histogram in range | `native-chrome` | `src/extension/fixedRangeVolumeProfile` |
| Anchored volume profile | Cumulative volume profile | `native-chrome` | `src/extension/anchoredVolumeProfile` |
| Price range | 2 price lines + delta label | `native-chrome` | `src/extension/priceRange` |
| Date range | 2 date lines + delta label | `native-chrome` | `src/extension/dateRange` |
| Date and price range | Rectangle + 4 labels | `native-chrome` | `src/extension/dateAndPriceRange` |
| Brush / bezier / freehand | Free draw | `widget-native` | |
| Text / note / label | Annotation | `widget-native` | |
| Measure | Range + % tool | `widget-native` | |
| Magnet mode | Snap to OHLC | `widget-native` | |
| Stay in drawing mode | Persist tool | `widget-native` | |
| Lock all drawings | Freeze | `widget-native` | |
| Hide all drawings | Toggle | `widget-native` | |
| Show/Hide price/coordinate fields | Inputs | `widget-native` | |
| Object tree | Layers panel | `v1-deferred` | — | §12 |
| Drawing settings popover | Stroke/color/magnet | `native-chrome` | `src/widget/drawing-bar` | |

### 3.11 Alerts (general)

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Price alert (crossing/greater/less) | Notify at price | `v1-deferred` | — | §12: button only in v1 |
| Indicator alert | Notify on indicator condition | `v1-deferred` | — | |
| Webhook alert | POST JSON to URL | `v2-future` | — | Trading-Bot-V2 has `/api/webhooks/tradingview`; Astroneum does NOT (separate project). See §3.12. Build new in `/opt/astroneum/demo/src/app/api/` if needed. |
| Alert dialog (condition/message/expiration/frequency) | Alert creator | `v1-deferred` | — | |
| Alert log/history | Past fires | `v1-deferred` | — | |
| Drag-to-set price line | Visual price alert | `v1-deferred` | — | |
| Trigger: once / once-per-bar-close / once-per-bar | Frequency modes | `api-bridged` | webhook handler | v21 uses `freq_once_per_bar_close` |

### 3.12 Webhook alerts — grounded in v21 (the 25 events)

All 25 `alert()` calls in the v21 source. Action × side × stage × reason. The "Bot handler" column references **Trading-Bot-V2**'s `/api/webhooks/tradingview` route (in `/root/Trading-Bot-V2/`), NOT Astroneum. Astroneum is a separate project and has NO webhook ingestion — the v21 events are reference-only (per the v21 Pine source being a reference for this doc, not a strategy Astroneum runs). If Astroneum needs webhook ingestion in the future, build a new route in `/opt/astroneum/demo/src/app/api/`.

| # | Action | Side | Stage | Reason | Bot handler | Status |
|---|---|---|---|---|---|---|
| 1 | `OPEN` | `LONG` | `ENTRY` | `entry_long` | `TradeExecutor.executeTrade` (BUY) | `api-bridged` |
| 2 | `OPEN` | `SHORT` | `ENTRY` | `entry_short` | `TradeExecutor.executeTrade` (SELL) | `api-bridged` |
| 3 | `UPDATE_SL` | `LONG` | `EARLY_BE` | `early_be_activated` | `handleLegacyUpdateSl` (STOP_MARKET algo) | `api-bridged` |
| 4 | `UPDATE_SL` | `SHORT` | `EARLY_BE` | `early_be_activated` | `handleLegacyUpdateSl` | `api-bridged` |
| 5 | `UPDATE_SL` | `LONG` | `RR_UPGRADE` | `rr_upgrade` | `handleLegacyUpdateSl` | `api-bridged` |
| 6 | `UPDATE_SL` | `SHORT` | `RR_UPGRADE` | `rr_upgrade` | `handleLegacyUpdateSl` | `api-bridged` |
| 7 | `PARTIAL_CLOSE` | `LONG` | `TP1` | `tp1_hit` | `handleLegacyPartialClose` (MARKET reduceOnly) | `api-bridged` |
| 8 | `PARTIAL_CLOSE` | `SHORT` | `TP1` | `tp1_hit` | `handleLegacyPartialClose` | `api-bridged` |
| 9 | `PARTIAL_CLOSE` | `LONG` | `TP2` | `tp2_hit` | `handleLegacyPartialClose` (+ TP2 SL upgrade) | `api-bridged` |
| 10 | `PARTIAL_CLOSE` | `SHORT` | `TP2` | `tp2_hit` | `handleLegacyPartialClose` | `api-bridged` |
| 11 | `PARTIAL_CLOSE` | `LONG` | `PARTIAL_TP` | `partial_tp` | `handleLegacyPartialClose` | `api-bridged` |
| 12 | `PARTIAL_CLOSE` | `SHORT` | `PARTIAL_TP` | `partial_tp` | `handleLegacyPartialClose` | `api-bridged` |
| 13 | `CLOSE` | `LONG` | `PROFIT_LOCK` | `profit_lock` | `handleClose` (full MARKET close) | `api-bridged` |
| 14 | `CLOSE` | `SHORT` | `PROFIT_LOCK` | `profit_lock` | `handleClose` | `api-bridged` |
| 15 | `CLOSE` | `LONG` | `ADX_DECAY` | `adx_decay` | `handleClose` | `api-bridged` |
| 16 | `CLOSE` | `SHORT` | `ADX_DECAY` | `adx_decay` | `handleClose` | `api-bridged` |
| 17 | `CLOSE` | `LONG` | `TREND_FADE` | `trend_fade` | `handleClose` | `api-bridged` |
| 18 | `CLOSE` | `SHORT` | `TREND_FADE` | `trend_fade` | `handleClose` | `api-bridged` |
| 19 | `CLOSE` | `LONG` | `PRE_SL_PROTECT` | `preSLReasonLong` (dynamic) | `handleClose` | `api-bridged` |
| 20 | `CLOSE` | `SHORT` | `PRE_SL_PROTECT` | `preSLReasonShort` (dynamic) | `handleClose` | `api-bridged` |
| 21 | `CLOSE` | `LONG` | `TP_FINAL` | `tp_final_hit` | `handleClose` | `api-bridged` |
| 22 | `CLOSE` | `SHORT` | `TP_FINAL` | `tp_final_hit` | `handleClose` | `api-bridged` |
| 23 | `CLOSE` | `LONG` | `TP1_FINAL` | `tp1_final_hit` | `handleClose` | `api-bridged` |
| 24 | `CLOSE` | `SHORT` | `TP1_FINAL` | `tp1_final_hit` | `handleClose` | `api-bridged` |
| 25 | `CLOSE` | `LONG`/`SHORT` | `SL_EXIT` | `reasonTag` (dynamic) | `handleClose` (SL hit via `strategy.exit`) | `api-bridged` |

**v14 → v21 deltas** (stages new in v21, missing from `docs/webhook-payloads.md`): `RR_UPGRADE`, `PROFIT_LOCK`, `ADX_DECAY`, `TREND_FADE`, `PRE_SL_PROTECT`, `TP1_FINAL`. The v14 doc covers `OPEN`, `UPDATE_SL` (only `EARLY_BE`), `PARTIAL_CLOSE` (`TP1`/`TP2`/`PARTIAL_TP`), `CLOSE` (only `SL_EXIT`/`TP_FINAL`). See §8.

### 3.13 Pine Script editor

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Editor pane | Code editing | `v1-deferred` | — | §12; widget-provided only |
| Compile / Add to chart | `Cmd-S` | `v1-deferred` | — | |
| Save / version | Script library | `v1-deferred` | — | |
| Console | `log.info()` output | `v1-deferred` | — | |

### 3.14 Pine Script functions — function-level reference

Signatures + whether v21 uses it. Status: `widget-native` (TV runtime) for all; Astroneum does not host a Pine runtime. Astroneum additionally has a deliberately narrower `strategySignals()` contract in `ScriptEngine.compileStrategy()`; it is not a Pine `strategy.*` implementation.

#### `strategy.*` (strategy context)

| Function | Signature (abbrev.) | v21? | Notes |
|---|---|---|---|
| `strategy()` | `strategy(title, shorttitle, overlay, initial_capital, currency, default_qty_type, default_qty_value, commission_type, commission_value, slippage, pyramiding, max_bars_back, calc_on_order_fills, process_orders_on_close, margin_long, margin_short)` | yes | v21: `initial_capital=1000`, `commission=0.05%`, `slippage=3`, `pyramiding=1`, `margin=20` (5x), `process_orders_on_close=true` |
| `strategy.entry` | `strategy.entry(id, direction, qty, limit, stop, comment, alert_message)` | yes | Entries |
| `strategy.exit` | `strategy.exit(id, from_id, qty, qty_percent, profit, limit, loss, stop, comment, alert_message)` | yes | SL exits |
| `strategy.close` | `strategy.close(id, qty, qty_percent, comment, comment_profit, comment_loss, alert_message)` | yes | 15 calls |
| `strategy.cancel` | `strategy.cancel(id)` | yes | |
| `strategy.close_all` | `strategy.close_all(comment, alert_message)` | no | |
| `strategy.entry_price` | `strategy.entry_price` | no | v21 uses `strategy.position_avg_price` |
| `strategy.position_size` | `strategy.position_size` | yes | |
| `strategy.position_avg_price` | `strategy.position_avg_price` | yes | |
| `strategy.equity` | `strategy.equity` | yes | |
| `strategy.netprofit` | `strategy.netprofit` | yes | |
| `strategy.grossprofit` | `strategy.grossprofit` | yes | |
| `strategy.grossloss` | `strategy.grossloss` | yes | |
| `strategy.initial_capital` | `strategy.initial_capital` | yes | |
| `strategy.openprofit` | `strategy.openprofit` | no | |
| `strategy.wintrades` | `strategy.wintrades` | yes | |
| `strategy.losstrades` | `strategy.losstrades` | no | |
| `strategy.closedtrades` | `strategy.closedtrades` | yes | |
| `strategy.closedtrades.profit(n)` | `.profit(index)` | yes | |
| `strategy.closedtrades.entry_time(n)` | `.entry_time` | no | |
| `strategy.closedtrades.exit_time(n)` | `.exit_time` | no | |
| `strategy.closedtrades.entry_price(n)` | `.entry_price` | no | |
| `strategy.closedtrades.exit_price(n)` | `.exit_price` | no | |
| `strategy.closedtrades.max_drawdown(n)` | `.max_drawdown` | no | |
| `strategy.closedtrades.runup(n)` | `.runup` | no | |
| `strategy.closedtrades.size` | `.size` | no | |
| `strategy.long` | enum | yes | |
| `strategy.short` | enum | yes | |
| `strategy.fixed` | enum (qty type) | yes | |
| `strategy.cash` | enum | no | |
| `strategy.commission.percent` | enum | yes | |
| `strategy.commission.cash_per_contract` | enum | no | |
| `strategy.commission.cash_per_order` | enum | no | |
| `strategy.averaging` | enum (position sizing) | no | |

#### `ta.*` (technical analysis)

| Function | v21? | Notes |
|---|---|---|
| `ta.sma(src, len)` | yes | Volume MA |
| `ta.ema(src, len)` | yes | 1D macro filter |
| `ta.wma(src, len)` | no | |
| `ta.rma(src, len)` | yes | SMMA fast/slow |
| `ta.hma(src, len)` | no | |
| `ta.vwma(src, len)` | no | |
| `ta.alma(src, len, off, sig)` | no | |
| `ta.swma(src)` | no | |
| `ta.atr(len)` | yes | Trail SL |
| `ta.tr` | no | |
| `ta.highest(src, len)` | yes | CI + equity peak |
| `ta.lowest(src, len)` | yes | CI |
| `ta.highestbars(src, len)` | no | |
| `ta.lowestbars(src, len)` | no | |
| `ta.pivothigh(left, right)` | yes | HH/LL detection |
| `ta.pivotlow(left, right)` | yes | |
| `ta.stdev(src, len)` | yes | BB |
| `ta.dev(src, len)` | no | |
| `ta.variance(src, len)` | no | |
| `ta.sar(start, inc, max)` | yes | |
| `ta.dmi(len, adxlen)` | yes | Decay + entry filter |
| `ta.macd(src, fast, slow, sig)` | yes | Filter + mom |
| `ta.rsi(src, len)` | yes | Mom decay |
| `ta.crossover(a, b)` | yes | |
| `ta.crossunder(a, b)` | yes | |
| `ta.cross(a, b)` | no | |
| `ta.sum(src, len)` | yes | CI ATR sum |
| `ta.cum(src)` | no | |
| `ta.mom(src, len)` | no | |
| `ta.roc(src, len)` | no | |
| `ta.tsi(src, r, s)` | no | |
| `ta.cci(src, len)` | no | |
| `ta.mfi(src, len)` | no | |
| `ta.wpr(len)` | no | |
| `ta.obv` | no | |
| `ta.vwap` | no | |
| `ta.vwap_custom` | no | |
| `ta.supertrend(factor, atrlen)` | no | |
| `ta.kc(mult, len, atrlen)` | no | |
| `ta.donchian(len)` | no | |
| `ta.bb(src, len, mult)` | no (v21 builds BB inline) | |
| `ta.bbw(src, len, mult)` | no | |
| `ta.ao(src)` | no | |
| `ta.ac` | no | |
| `ta.linreg(src, len, offset)` | no | |
| `ta.median(src, len)` | no | |
| `ta.mode(src, len)` | no | |
| `ta.range(src, len)` | no | |
| `ta.change(src, len)` | no | |
| `ta.falling(src, len)` | no | |
| `ta.rising(src, len)` | no | |
| `ta.barssince(cond)` | no | |
| `ta.valuewhen(cond, src, occ)` | no | |
| `ta.max_bars_back(src, len)` | no | |

#### `request.*`

| Function | v21? | Notes |
|---|---|---|
| `request.security(sym, tf, expr, gaps, lookahead)` | yes | 1D EMA, `lookahead_off` (no-bias fix) |
| `request.security_lower_tf(sym, tf, expr)` | no | |
| `request.seed(sym, prop)` | no | |
| `request.quandl(ticker)` | no | |
| `request.financial(sym, fin_id, period)` | no | |
| `request.splits(sym)` | no | |
| `request.dividends(sym)` | no | |
| `request.bars_count()` | no | |

#### `input.*`

| Function | v21? | Notes |
|---|---|---|
| `input.float(def, title, group, minval, maxval, step, tooltip)` | yes | Many |
| `input.int(def, title, group, minval, maxval)` | no | |
| `input.string(def, title, group)` | yes | `i_whAccountId`, `i_whStrategy` |
| `input.bool(def, title, group, tooltip)` | yes | |
| `input.color(def, title)` | no | |
| `input.source(def, title)` | no | |
| `input.timeframe(def, title)` | no | |
| `input.symbol(def, title)` | no | |
| `input.session(def, title)` | no | |
| `input.text_area(def, title)` | no | |
| `input.price(def, title)` | no | |
| `input.time(def, title)` | no | |
| `input.enum(def, title)` | no | |

#### `table.*`

| Function | v21? | Notes |
|---|---|---|
| `table.new(pos, columns, rows, ...)` | yes | Strategy dashboard |
| `table.cell(t, col, row, text, ...)` | yes | 38+ rows (§3.16) |
| `table.merge_cells(t, start_col, start_row, end_col, end_row)` | no | |
| `table.delete(t)` | no | |
| `table.clear(t, start_col, start_row, end_col, end_row)` | no | |

#### Drawing primitives (`label.*`, `line.*`, `box.*`, `plot.*`, `fill`, `hline`, `bgcolor`, `barcolor`)

| Function | v21? | Notes |
|---|---|---|
| `plot(src, title, color, linewidth, style, ...)` | no (strategy, not indicator) | |
| `plotshape`, `plotchar`, `plotcandle`, `plotbar` | no | |
| `fill(h1, h2, color)` | no | |
| `hline(price, title, color, linestyle, linewidth)` | no | |
| `bgcolor(color)` | no | |
| `barcolor(color)` | no | |
| `label.new(...)`, `label.set_*`, `label.copy`, `label.delete` | no | v21 uses `table.cell` for all display |
| `line.new(...)`, `line.set_*` | no | |
| `box.new(...)`, `box.set_*` | no | |

#### `array.*`, `matrix.*`, `map.*`, `log.*`, `math.*`, `str.*`, `color.*`

| Function | v21? | Notes |
|---|---|---|
| `array.new_*`, `array.push`, `array.get`, `array.pop`, `array.size`, `array.first`, `array.last`, `array.sort`, `array.includes`, `array.slice`, ... | no | |
| `matrix.new_*`, `matrix.get`, `matrix.set`, ... | no | |
| `map.new<*>`, `map.put`, `map.get`, `map.remove`, `map.keys`, `map.values` | no | |
| `log.info`, `log.warning`, `log.error` | no | |
| `math.sum`, `math.log10`, `math.round`, `math.abs` | yes | CI + dashboard |
| `math.max`, `math.min`, `math.avg`, `math.pow`, `math.sqrt`, `math.floor`, `math.ceil`, `math.sign`, `math.exp`, `math.log`, `math.sin`, `math.cos`, ... | partial (`math.abs` etc.) | |
| `str.tostring(val, fmt)`, `str.format(...)`, `str.contains`, `str.split`, `str.replace`, `str.length`, `str.upper`/`lower` | yes (`tostring`, `format`) | Dashboard formatting |
| `color.new(c, transparency)`, `color.rgb(r,g,b,t)`, `color.from_gradient`, `color.mix` | yes (`color.new`) | Dashboard colors |

#### Built-in vars

| Var | v21? | Notes |
|---|---|---|
| `open`, `high`, `low`, `close`, `volume`, `time`, `time_close`, `bar_index`, `last_bar_index`, `n`, `barstate.*` | yes (`close`, `high`, `low`, `volume`, `time`, `bar_index`) | |
| `syminfo.ticker`, `syminfo.prefix`, `syminfo.tickerid`, `syminfo.currency`, `syminfo.basecurrency`, `syminfo.pointvalue`, `syminfo.mintick`, `syminfo.type` | yes (`ticker`, `prefix`, `tickerid`) | Payload envelope |
| `timeframe.period`, `timeframe.isintraday`, `timeframe.isdaily`, `timeframe.isweekly`, `timeframe.ismonthly`, `timeframe.multiplier` | yes (`period`) | Payload envelope |
| `session.ispremarket`, `session.ismarket`, `session.ispostmarket`, `session.isclose` | no | |
| `os.*` (now, later, context, fulltime) | no | |

### 3.15 Strategy Tester

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Backtest engine | Replays trades on history | `native-chrome` | `src/strategy/BacktestEngine.ts` | Deterministic bar-close fills, commission, slippage, trades, equity, and drawdown; chart-replay bridge remains |
| Performance summary | Net profit, PF, expected payoff, B&H, drawdown, sharpe, sortino | `native-chrome` | `StrategyTesterPanel` | Runtime report is fed by compiled `strategySignals()` against chart history |
| Trade list | Per-trade entry/exit/P&L | `native-chrome` | `StrategyTesterPanel` | Runtime data; filtering/pagination remain deferred |
| Equity curve | Equity over time | `native-chrome` | `BacktestResult.equity` | Typed series available; chart visual remains |
| Drawdown curve | DD over time | `native-chrome` | `BacktestResult.equity` | Typed series available; chart visual remains |
| Trade markers on chart | Arrows on entry/exit | `widget-native` | | |
| Strategy properties | Commission, slippage, capital, sizing | `widget-native` | | v21 sets these in `strategy()` |
| Currency conversion | Convert to display ccy | `v1-deferred` | — | |

### 3.16 Strategy report — v21 on-chart dashboard (38 rows)

The v21 strategy emits a `table.new` overlay with 38 rows. This is the strategy's self-report. Astroneum's Trading Panel tab could surface these natively (post-v1). For v1, the table renders inside the widget.

| Row | Label | Source (v21) | Mirror status |
|---|---|---|---|
| 0 | Title / ticker | `strategy.title` + `syminfo.ticker` | `widget-native` |
| 1 | Repaint Check | `sameBarTradeCount` (computed) | `widget-native` |
| 2 | Net Profit | `strategy.netprofit` / `strategy.initial_capital * 100` | `widget-native` |
| 3 | Win Rate | `strategy.wintrades` / `strategy.closedtrades * 100` | `widget-native` |
| 4 | Current DD | `currentDD` (computed from `ta.highest(strategy.equity, 500)`) | `widget-native` |
| 5 | Slippage Sim | `i_useSlippage` / `i_slippagePct` | `widget-native` |
| 6 | Kelly Size | `kellySize` (computed, `i_kellyFrac`) | `widget-native` |
| 7 | Regime (CI) | `ciVal` vs `i_ciThresh` | `widget-native` |
| 8 | 1D EMA Macro | `ema1D` via `request.security(...,"1D",...)` | `widget-native` |
| 9 | Final Size | `finalSizeLong`/`Short` | `widget-native` |
| 10 | Next Qty | `qtyLong`/`qtyShort` | `widget-native` |
| 11 | Position | `strategy.position_size` sign → LONG/SHORT/FLAT | `widget-native` |
| 12 | Bars In Trade | `barsInTrade` (computed) | `widget-native` |
| 13 | Post-Loss CD | `inPostLossCD`/`postLossCDCount` | `widget-native` |
| 14 | TP Stage 1 | `i_useTP1`/`i_tp1Pct`/`i_tp1Qty` | `widget-native` |
| 15 | TP Stage 2 | `i_useTP2`/`i_tp2Pct`/`i_tp2Qty` | `widget-native` |
| 16 | TP Final | `i_useTPFinal`/`i_tpFinalPct` | `widget-native` |
| 17 | TP1 Status | `tp1LongDone`/`tp1ShortDone` | `widget-native` |
| 18 | TP2 Status | `tp2LongDone`/`tp2ShortDone` | `widget-native` |
| 19 | Trail SL | `i_useTrailSL` + `i_trailMult*`/`i_trailATR2` | `widget-native` |
| 20 | Early BE | `i_useEarlyBE`/`earlyBEActivated` | `widget-native` |
| 21 | Profit Lock | `i_useProfitLock`/`plActive`/`drawdownFromPeak` | `widget-native` |
| 22 | SAR | `sarBull` (from `ta.sar`) | `widget-native` |
| 23 | SMMA Trend | `aboveMA` (close vs `ta.rma` slow) | `widget-native` |
| 24 | BB Position | close vs `bbUpper`/`bbLower` | `widget-native` |
| 25 | Profit Factor | `strategy.grossprofit` / `abs(strategy.grossloss)` | `widget-native` |
| 26 | Avg Trade $ | `strategy.netprofit` / `strategy.closedtrades` | `widget-native` |
| 27 | Profit / Peak R | `currentProfitR`/`peakProfitR` (R-multiples) | `widget-native` |
| 28 | SL Distance | `(close - slNow)/close * 100` | `widget-native` |
| 29 | Entry Gate | `inPause`/`pauseCount` | `widget-native` |
| 30 | ADX L-Filter | `adxLongOK`/`adxEntry`/`i_minADXLong` | `widget-native` |
| 31 | ADX S-Filter | `adxShortOK`/`i_minADXShort` | `widget-native` |
| 32 | MACD L-Filter | `macdLongOK`/`macdHist` | `widget-native` |
| 33 | MACD S-Filter | `macdShortOK` | `widget-native` |
| 34 | Pre-SL Protect section | section header | `widget-native` |
| 35 | MomDecay | `momDecayExitLong/Short`/`momRSI`/`i_momDecayMode` | `widget-native` |
| 36 | CandleRev | `candleRevExitLong/Short` | `widget-native` |
| 37 | VolSpike | `volSpikeExitLong/Short`/`volMultDisp` | `widget-native` |
| 38 | PreSL Status | `preSLExitLong/Short` | `widget-native` |

### 3.17 Watchlists

Behavioral evidence: `tv-mirror-reference/watchlist.md` (panel anatomy, control inventory, sortable-column and quote-state model, gaps).

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Multiple watchlists | Tabs of lists | `native-chrome` | `demo/src/app/components/panels/WatchlistPanel.tsx`, `WatchlistManager` | Persisted horizontal tabs with one active list and an overflow selector at six lists. |
| Add/remove symbol | Edit list | `native-chrome` | `WatchlistPanel.tsx`, `WatchlistManager`, `SymbolSearchModal` | Validated search stores full metadata; context menu removes symbols. |
| Reorder | Drag rows | `native-chrome` | `WatchlistPanel.tsx`, `WatchlistManager` | Same-list and cross-list symbol drag ship; list-tab reorder remains. |
| Details panel | OHLC + P&L + description | `native-chrome` | `DetailsPanel` / `WatchlistPanel` sub-tab | Live OHLC + metadata ship; fundamentals and P&L remain 🟦 v1.1 pending data sources. |
| Highlight selected | Active row | `native-chrome` | `WatchlistPanel.tsx` | Indigo tint + 1px inset signal; tabular figures on numeric columns. |
| Last price column | Live last price per row | `native-chrome` | `WatchlistPanel.tsx`, `Datafeed.getQuotes?` | Right-aligned tabular figures with precision metadata and `—` fallback. |
| Column header + sort | Click to sort asc/desc | `native-chrome` | `WatchlistPanel.tsx`, `WatchlistManager.setSort` | Sticky accessible headers and per-list persistence ship. |
| Row context menu | Right-click actions | `v1-in-scope` | `WatchlistPanel.tsx` | Copy, alert, move, remove, and keyboard invocation ship; inferred Hide/Lock remain. |
| Header toolbar actions | Tabs + add + settings + more | `native-chrome` | `WatchlistPanel.tsx` | Add, settings, view preset, Rename/Delete/Duplicate/Export, and list colors ship. |
| Empty-state CTA | Add-symbol prompt | `native-chrome` | `WatchlistPanel.tsx` | Empty-state action opens validated symbol search. |
| Cross-list drag | Move symbol between lists | `native-chrome` | `WatchlistManager.moveSymbol` | Tab drop targets call persisted cross-list moves. |
| Per-list color dot | Visual list identifier | `native-chrome` | `WatchlistManager.setColor` | Six-color palette and list dots ship. |
| Advanced/Simple toggle | Column preset switch | `native-chrome` | `WatchlistPanel.tsx` | Per-list Simple and Advanced presets ship. |
| Column chooser popover | Toggle columns | `native-chrome` | `WatchlistManager.setColumns` | Persisted chooser with reset and keyboard dismissal ships. |
| Live quote polling | Multi-symbol price stream | `api-bridged` | `Datafeed.getQuotes?`, `StandardCryptoDatafeed`, `WatchlistManager.updateQuotes` | Binance/Bitget/OKX quotes poll every 2s while visible. |
| No-matches + retry | Error recovery | `native-chrome` | `WatchlistPanel.tsx`, `SymbolSearchModal` | Search no-match and quote Retry states ship. |
| News sub-tab | Symbol-filtered news | `v1-deferred` | `WatchlistPanel.tsx` | Folded into the panel with an honest empty state until a news provider is connected. |

### 3.18 Screener

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Stock screener | Filter stocks | `v1-deferred` | — | §12; separate product |
| Crypto screener | Filter coins | `v1-deferred` | — | |
| Forex / ETF screener | Filter | `v1-deferred` | — | |
| Filter conditions | Metric rules | `v1-deferred` | — | |
| Presets | Saved filters | `v1-deferred` | — | |

### 3.19 Markets

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Heat maps | Treemap by cap | `v1-deferred` | — | §12 |
| Top gainers/losers | Movers | `v1-deferred` | — | |
| Sector performance | Heatmap | `v1-deferred` | — | |
| Economic calendar | Events | `v1-deferred` | — | |
| Earnings/dividends/splits calendars | Events | `v1-deferred` | — | |
| News feed | Headlines | `v1-deferred` | — | |
| Ideas / social | User content | `v1-deferred` | — | |

### 3.20 Trading panel

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Paper trading | Simulated account | `v1-deferred` | — | §12; Astroneum is charting-first, no trading in v1 |
| Broker connections | OAuth brokers | `v1-deferred` | — | §12 |
| Order ticket (market/limit/stop/stop-limit) | Place order | `v1-deferred` | — | Astroneum has no `/api/orders`; build new in `/opt/astroneum/demo/src/app/api/` if needed. Do NOT reuse Trading-Bot-V2's `OrderPanel`. |
| Positions list | Open positions | `v1-deferred` | — | Use `astroneum/portfolio` `PortfolioTracker` for read-only display. Do NOT reuse Trading-Bot-V2's `OpenPositions` or `/api/tv-positions`. |
| Orders list | Working orders | `v1-deferred` | — | Astroneum has no orders API; build new if needed. |
| History | Filled/closed | `v1-deferred` | — | Build new in `/opt/astroneum/demo/src/app/api/` if needed. |
| DOM / depth of market | L2 ladder | `v1-deferred` | — | §12; library supports it, APP defers surface. |
| On-chart order dragging | Drag SL/TP | `v1-deferred` | — | §12 |
| Account summary | Balance/equity/margin | `v1-deferred` | — | Use `astroneum/portfolio` `PortfolioTracker`. Do NOT use Trading-Bot-V2's `/api/portfolio`. |

### 3.21 Replay

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Bar replay | Step back/forward | `widget-native` | | |
| Autoplay | Auto-step | `widget-native` | | |
| Speed control | ms delay | `widget-native` | | |
| Replay from date | Start point | `widget-native` | | |

### 3.22 Layouts & templates

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Save layout | Chart state | `native-chrome` | `ChartTemplateManager`, `SaveLoadMenu` | localStorage persistence with active-layout autosave |
| Load layout | Restore | `native-chrome` | `AstroneumChart.loadState()` | restores the active layout on reload with chart settings, indicators, and drawings |
| Chart templates | Indicator + settings preset | `native-chrome` | `ChartTemplateManager` | named local templates with rename, duplicate, timestamps, and confirmed delete |

### 3.23 Search

| Function | TV behavior | Status | Pointer | Notes |
|---|---|---|---|---|
| Symbol search | Ticker picker | `native-chrome` | `src/widget/symbol-search-modal`, `src/widget/period-bar` | `/` hotkey; PeriodBar trigger carries `title`, `data-semantic-id`, `apply-common-tooltip`, and mobile compact text behavior |
| TV search (everything) | Global search | `v1-deferred` | — | |
| Command palette | App-level actions | `native-chrome` | build in `/opt/astroneum/demo/src/app/_components/` | `Cmd/Ctrl-K`. Do NOT inherit from CryptoBot — separate project. |

---

## 4. Webhook payload schema (`f_buildPayload`)

Source: v21 Pine source. Single envelope; one `alert()` call per event. All events use `alert.freq_once_per_bar_close`.

### Fields (always present)

| Field | Type | Source | Notes |
|---|---|---|---|
| `action` | string | arg | `OPEN` / `UPDATE_SL` / `PARTIAL_CLOSE` / `CLOSE` |
| `side` | string | arg | `LONG` / `SHORT` |
| `stage` | string | arg | `ENTRY` / `EARLY_BE` / `RR_UPGRADE` / `TP1` / `TP2` / `PARTIAL_TP` / `PROFIT_LOCK` / `ADX_DECAY` / `TREND_FADE` / `PRE_SL_PROTECT` / `TP_FINAL` / `TP1_FINAL` / `SL_EXIT` |
| `qty_closed` | number | arg | `#.########` (qty closed in this event) |
| `qty_pct` | number | arg | `#.##` (percent of remaining) |
| `remaining_pct` | number | arg | `#.##` (percent of entry remaining after) |
| `remaining_qty` | number | `wh_remainingQty` | `#.########` |
| `entry_qty` | number | `wh_entryQty` | `#.########` |
| `entry_price` | number | `wh_entryPrice` | `#.########` |
| `price` | number | `close` | `#.########` (current close) |
| `new_sl` | number | arg or `0.0` | `#.########` (only `UPDATE_SL` sets real value) |
| `size_pct` | number | `wh_size_pct` | `#.####` |
| `leverage` | int | `i_maxLeverage` | no formatting |
| `reason` | string | arg | human-readable trigger |
| `bar_time` | int | `time` | unix ms |
| `bar_index` | int | `bar_index` | |

### Fields (conditional on `i_whEnvelope=true`)

| Field | Type | Source | Notes |
|---|---|---|---|
| `strategy` | string | `i_whStrategy` | default `BTC_H4_v28` |
| `account` | string | `i_whAccountId` | default `acct_main` |
| `symbol` | string | `syminfo.ticker` | e.g. `BTCUSD` |
| `exchange` | string | `syminfo.prefix` | e.g. `INDEX` |
| `interval` | string | `timeframe.period` | e.g. `240` |
| `position_id` | string | `wh_positionId` | `L_<barTime>_<barIdx>_<n>` or `S_...` |

### Wire format

`POST /api/webhooks/tradingview?token=<webhook.token>` with body = the JSON string produced by `f_buildPayload`. The `{{strategy.order.alert_message}}` placeholder in the TV alert dialog is filled by TV with this string. The bot parses the JSON, normalizes action/symbol (strip `.P`), and dispatches.

> **Project separation:** This wire format and the `/api/webhooks/tradingview` route belong to **Trading-Bot-V2** (`/root/Trading-Bot-V2/`), NOT Astroneum. Astroneum (`/opt/astroneum/`) has no webhook ingestion. The schema is documented here as reference for the v21 Pine source; if Astroneum needs webhook ingestion, build a new route in `/opt/astroneum/demo/src/app/api/`.

---

## 5. React prop / chrome hand-off map

Astroneum does not embed `TradingView.widget`. Configuration is via React props, instance methods, managers, and demo chrome. This map replaces the old widget-flag model.

| Surface / behavior | Astroneum control | Native chrome owner |
|---|---|---|
| Top toolbar | Demo shell, `PeriodBar`, `ChartTypeDropdown`, modal triggers | `demo/src/app/components/ChartTerminal.tsx` |
| OHLC legend | Not built yet | `OhlcLegend.tsx` (section 11) |
| Right-click context menu | Not built yet | `ContextMenu.tsx` (section 11) |
| Left drawing toolbar | `drawingBarVisible`, `src/widget/drawing-bar`, `src/extension/*` (32 overlays) | Library-owned `DrawingBar` with 6 groups (cursor, singleLine, moreLine, polygon, fibonacci, wave) + forecasting group (12 tools in 3 sections); `TerminalShell` insets the dock to preserve the rail |
| Symbol change | `symbol` prop, `setSymbol()` | `src/widget/symbol-search-modal`, `PeriodBar`, `WatchlistPanel` |
| Date-range footer | `DateRangeNavigator` plus `ChartPlugin` engine bridge | `demo/src/app/components/DateRangeNavigator.tsx` |
| Theme | `theme` prop | v1 dark; high-contrast supported |
| Chart type | `barStyle` / chart-type state | `demo/src/app/components/ChartTypeDropdown.tsx` |
| Timeframe | `period` prop, `setPeriod()` | `src/widget/period-bar` |
| Indicators | `mainIndicators`, `subIndicators`, indicator widgets | `IndicatorModal`, `IndicatorSettingModal` |
| Save/load | `serializeState()`, `loadState()`, `ChartTemplateManager` | `demo/src/app/components/SaveLoadMenu.tsx` |
| Shell collapse | CSS grid vars + `localStorage` key `astroneum:shell` | `demo/src/app/components/TerminalShell.tsx` |

---

## 6. Cross-reference to `design-astroneum.md`

### §11 In-scope (build in v1)
- Chart right-click context menu → `ContextMenu.tsx` (this doc §3.10 / design §11)
- Crosshair OHLC legend → `OhlcLegend.tsx` (this doc §3.16 / design §11)

### §12 Out-of-scope (defer)
- Multi-chart layouts → §3.3
- Compare / overlay / spread → §3.5
- Indicator settings dialog → §3.9
- Full alerts flow → §3.11
- Screener / Heatmaps / Calendars / News → §3.18, §3.19
- Broker / DOM / on-chart order dragging → §3.20
- Native Pine Editor / Strategy Tester → §3.13, §3.15
- Light theme → §5 (`theme: "dark"` locked)
- Mobile/touch → design §4 responsive
- Object tree → §3.10
- Logo / brand mark → design §12

---

## 7. Build / verify workflow

When working on `/astroneum`:

1. Identify the TV function being mirrored.
2. Find it in §3 (catalog).
3. Read its status:
   - `widget-native` -> use the existing Astroneum prop, method, manager, plugin, or widget. Do not rebuild.
   - `api-bridged` → reuse the path in §2. Do not rebuild.
   - `native-chrome` -> build per `design-astroneum.md` ?5, usually in `demo/src/app/components/` or `src/widget/`.
   - `v1-in-scope` → build now per `design-astroneum.md` §11.
   - `v1-deferred` → do not build; note for v2.
   - `v2-future` → note only.
4. If webhook-related → cross-check §3.12 (the 25 events) and §4 (schema). Note: the `/api/webhooks/tradingview` route is in Trading-Bot-V2, NOT Astroneum. If building webhook ingestion in Astroneum, create a new route in `/opt/astroneum/demo/src/app/api/`.
5. If Pine-related → cross-check §3.14 for whether v21 uses the function.
6. After implementing, update the catalog row's `Pointer` column.

---

## 8. Versioning

- **Authoritative source for webhook events:** the v21 Pine source (`BTC H4 OP v21 WH+ LIVE`, title `CTC BB·SMMA H4 v2.9 + Webhook (Live-Ready)`). This doc was generated from it directly.
- **Stale doc:** `docs/webhook-payloads.md` covers v14 and is missing 6 stages present in v21: `RR_UPGRADE`, `PROFIT_LOCK`, `ADX_DECAY`, `TREND_FADE`, `PRE_SL_PROTECT`, `TP1_FINAL`. A sync pass is needed (out of scope for this doc).
- **TV version drift:** TradingView ships new indicators/functions quarterly. The `v2-future` bucket catches known-not-yet-mapped items. Re-verify the catalog against TV release notes each quarter.
- **Pine version:** v5. v6 exists; v21 source does not use v6-only features.
- **v21 as reference:** the v21 Pine source was used as a reference to ground §3.12, §3.14, §3.16, and §4. It is not a strategy to reproduce inside Astroneum; Astroneum ingests its webhook events and displays its positions, it does not re-host the strategy.

---

## 9. Verification checklist

- [ ] Every §3 catalog row has a `Status` and (where applicable) a `Pointer`.
- [ ] Every §3.12 webhook event maps 1:1 to an `alert()` call in the v21 source.
- [ ] Every §3.16 dashboard row maps 1:1 to a `table.cell` call in the v21 source.
- [ ] Every §11/§12 item in `design-astroneum.md` is linked from §6 of this doc.
- [ ] Every ?5 React prop / chrome hand-off maps to the current demo or library source.
- [ ] Every `api-bridged` pointer resolves to a file that exists under `src/app/api/` or `src/lib/`.
- [ ] Every `native-chrome` pointer resolves to a planned or existing file under `demo/src/app/components/` or `src/widget/`.
