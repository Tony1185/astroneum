---
name: Astroneum
description: A charting-first trading terminal built on the astroneum npm package. The chart is the page; everything else is thin chrome.
colors:
  bg: "#131722"
  surface: "#1E222D"
  surface-elevated: "#2A2E39"
  border-hairline: "#363A45"
  border-strong: "#434651"
  ink: "#D1D4DC"
  ink-muted: "#787B86"
  ink-subtle: "#5D606B"
  accent: "#2962FF"
  accent-soft: "#1E53E5"
  accent-deep: "#0D2B8C"
  profit: "#26A69A"
  loss: "#EF5350"
  warning: "#F89D3E"
typography:
  display:
    fontFamily: "'Trebuchet MS', -apple-system, BlinkMacSystemFont, Roboto, Ubuntu, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "1.875rem"
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Trebuchet MS', -apple-system, BlinkMacSystemFont, Roboto, Ubuntu, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: "1.375rem"
    letterSpacing: "normal"
  title:
    fontFamily: "'Trebuchet MS', -apple-system, BlinkMacSystemFont, Roboto, Ubuntu, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: "1.125rem"
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    letterSpacing: "normal"
  label:
    fontFamily: "'Trebuchet MS', -apple-system, BlinkMacSystemFont, Roboto, Ubuntu, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: "0.9375rem"
    letterSpacing: "0.02em"
  numeric:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: "1.25rem"
    letterSpacing: "normal"
    fontFeature: "'tnum' 1, 'cv11' 1"
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
components:
  toolbar-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    padding: "6px"
  toolbar-button-hover:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink}"
  toolbar-button-active:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.accent}"
  symbol-search-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
    border: "1px solid {colors.border-hairline}"
  watchlist-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "6px 10px"
    border: "1px solid transparent"
  watchlist-row-hover:
    backgroundColor: "{colors.surface-elevated}"
  watchlist-row-selected:
    borderLeft: "2px solid {colors.accent}"
    backgroundColor: "{colors.surface}"
  panel-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    padding: "8px 12px"
  panel-tab-active:
    textColor: "{colors.ink}"
    borderBottom: "2px solid {colors.accent}"
  context-menu:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "4px"
    border: "1px solid {colors.border-hairline}"
    boxShadow: "0 8px 32px -8px rgba(0, 0, 0, 0.6)"
  context-menu-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  context-menu-item-hover:
    backgroundColor: "{colors.surface-elevated}"
  context-menu-item-disabled:
    textColor: "{colors.ink-subtle}"
  ohlc-legend:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "8px 12px"
---

# Design System: Astroneum

> **Last verified against:** `astroneum` pre-v1.0 (pre-integration in `/opt/astroneum`; reference: `Desktop\Astroneum\docs\api.md`) Â· TV Super Chart Jul 2026 Â· `/opt/astroneum` @ HEAD.

## 1. Overview

**Creative North Star: "The Astroneum Terminal"**

Astroneum is a charting-first trading product. The chart is the page; everything else is thin chrome around it. The product mirrors TradingView's Super Chart terminal: a multi-pane layout where one surface (the chart) occupies the majority of the screen, and four thin regions (top bar, left drawing toolbar, right watchlist rail, bottom panel) carry the supporting state. Astroneum is NOT a dashboard. It rejects the SaaS marketing dialect â€” hero-metric grids, glass panels, gradient text, animated sparkle, motivational empty states, tracked-uppercase eyebrows â€” that has saturated crypto and fintech UI. Its temperament is closer to TradingView, Bloomberg Terminal, and ThinkorSwim than to any exchange's marketing site.

The aesthetic is **dense, precise, instrument-grade**. The operator is a chartist first and a trader second; the interface is built for someone who reads price action, draws levels, and fires orders from the same canvas. Density is allowed because the operator is fluent in this domain and wants to see more, not less. Identity is carried by precision (tabular numerics, hairline borders, exact spacing rhythm, a single accent used sparingly), not by decoration.

**Mount model.** The chart pane is `<AstroneumChart>` from the `astroneum` npm package â€” a MIT-licensed, TV-class React charting library (Canvas2D / WebGL2, Web Workers, OPFS cache, `EventBus`, plugin system, subpath modules for replay/multichart/watchlist/portfolio/alerts/script/crypto datafeeds). Astroneum does NOT embed a TradingView widget; the `astroneum` library IS the chart engine. Everything around it (top bar, left toolbar, right rail, bottom panel, context menu, OHLC legend) is native Next.js chrome, styled to match the library's dark palette so the seam between `<AstroneumChart>` and chrome is invisible. The library is the chart; Astroneum chrome wraps it.

**Key Characteristics:**
- Single accent (`#2962FF`, Astroneum Blue) used on â‰¤8% of any screen.
- Three neutral tones stack for depth: BG â†’ Surface â†’ Surface-Elevated. Matched to the `astroneum` library's default dark theme.
- Two UI type families: Trebuchet MS for labels and headings, Inter with tabular-nums for all data.
- Profit/Loss carried by teal and coral, paired always with the numeric sign or an explicit side label.
- Motion conveys state only: crosshair tracking, tooltip follow, panel collapse. No entrance animations. No card hover lifts.
- Chart-occupies-most-of-screen: the chart pane is never smaller than 60% of non-chrome viewport area at any breakpoint â‰¥ lg.

## 2. Colors: The TV Dark Palette

The palette is TradingView's dark theme, transcribed exactly. Astroneum inherits it so `<AstroneumChart>` and the native chrome read as one surface. Anything outside this list is wrong.

### Primary
- **Astroneum Blue** (`#2962FF`, `oklch(0.55 0.22 264)`): The single accent. Reserved for the active panel tab underline, selected watchlist row left-edge, focused input ring, primary action button, current timeframe button, and the active drawing-tool indicator. Never used for decoration, never on inactive states, never paired with another saturated color on the same screen.
- **Astroneum Blue Soft** (`#1E53E5`, `oklch(0.50 0.22 264)`): Hover state of `Astroneum Blue` only. Not a standalone color.
- **Astroneum Blue Deep** (`#0D2B8C`, `oklch(0.27 0.16 264)`): Used as a 12% background tint behind the selected watchlist row and the active toolbar button, and as the deep ring on focused inputs. Not used for text.

### Tertiary (Data Semantics)
- **Profit Teal** (`#26A69A`, `oklch(0.65 0.10 175)`): Positive P&L, BUY/LONG side pill, "Connected" status dot, "Live" mode chip. Always paired with the numeric sign (`+`) so the meaning survives color blindness.
- **Loss Coral** (`#EF5350`, `oklch(0.63 0.18 25)`): Negative P&L, SELL/SHORT side pill, destructive action label, error border, unread alert badge. Always paired with the numeric sign (`-`) or an explicit destructive verb.
- **Warning Amber** (`#F89D3E`, `oklch(0.80 0.14 65)`): "Paper Trading" mode chip, expiring API key notice, partial-fill warnings. Rare. Never used for primary action.

### Neutral
- **Terminal BG** (`#131722`, `oklch(0.16 0.01 245)`): The page background. Matches the `astroneum` library's default dark theme so the seam is invisible.
- **Surface** (`#1E222D`, `oklch(0.20 0.01 245)`): The default panel surface. Top bar, watchlist rail, bottom panel, context menu, OHLC legend container chrome.
- **Surface Elevated** (`#2A2E39`, `oklch(0.24 0.01 245)`): Hovered rows, hovered toolbar buttons, popover/dropdown surfaces, active-item background tint.
- **Hairline Border** (`#363A45`, `oklch(0.30 0.01 245)`): The default stroke. 1px everywhere a boundary is needed.
- **Border Strong** (`#434651`, `oklch(0.36 0.01 245)`): Active panel tab underline fallback, divider lines between major regions.
- **Ink** (`#D1D4DC`, `oklch(0.86 0.005 245)`): Default text color. Cool off-white.
- **Ink Muted** (`#787B86`, `oklch(0.52 0.008 245)`): Secondary text. Body-text contrast â‰¥4.5:1 against Terminal BG.
- **Ink Subtle** (`#5D606B`, `oklch(0.42 0.008 245)`): Tertiary text. Disabled state, timestamps.

### Named Rules

**The One Voice Rule.** Astroneum Blue is used on â‰¤8% of pixels on any screen.
**The Sign + Color Rule.** P&L and side semantics always carry the numeric sign or an explicit label.
**The Two-Layer Rule.** Neutral surfaces stack at most three tones deep: BG â†’ Surface â†’ Surface-Elevated.
**The Match-The-Library Rule.** Native chrome colors match the `astroneum` library's dark theme exactly. Do not tune `#131722` toward a brand tint; if chrome drifts, the seam shows.

## 3. Typography

**UI Font:** Trebuchet MS (with `-apple-system, BlinkMacSystemFont, Roboto, Ubuntu, sans-serif` fallback)
**Data Font:** Inter (with `ui-sans-serif, system-ui, sans-serif` fallback)
**Numeric Font:** Inter with `font-feature-settings: 'tnum' 1, 'cv11' 1` for tabular numerals

**Character:** Two families, deliberately split. Trebuchet MS carries UI chrome (panel titles, toolbar labels, symbol search, watchlist symbols, tab labels). Inter carries data (prices, P&L, quantities, percentages, timestamps). The Inter numeric variant locks digits to a fixed advance so columns of numbers align.

### Hierarchy

- **Display** (Trebuchet MS, 700, 1.5rem / 1.875rem, -0.01em): The active symbol/ticker at top-left of the chart legend only. One per screen.
- **Headline** (Trebuchet MS, 700, 1rem / 1.375rem): Panel titles â€” "Watchlist", "Trading Panel", "Open Positions".
- **Title** (Trebuchet MS, 700, 0.8125rem / 1.125rem): Section titles inside a panel, modal titles, popover headers.
- **Body** (Inter, 400, 0.8125rem / 1.25rem): Default text.
- **Label** (Trebuchet MS, 700, 0.6875rem / 0.9375rem, 0.02em): Toolbar button tooltips, table column headers, form field labels. Sentence case, never tracked-uppercase.
- **Numeric** (Inter with tabular-nums, 500, 0.8125rem / 1.25rem): All numbers.

### Named Rules

**The No-Eyebrow Rule.** Tracked uppercase labels above sections are prohibited.
**The Tabular Rule.** Every numeric value uses tabular numerals.
**The Display Ceiling.** Display style maxes out at 1.5rem (24px).
**The Family-Split Rule.** Trebuchet MS for UI chrome; Inter for data. Never mix.

## 4. Layout: The Super Chart Shell

Astroneum v1 ships one layout: the Super Chart terminal. It is a 5-region grid that fills the viewport below the app's shared top navigation. The chart pane is the dominant region; the four chrome regions are thin and dense.

### Regions

| Region | Size | Position | Contents |
|---|---|---|---|
| Top bar | 44px height, full width | top | symbol-search pill (left), timeframe selector, chart-type button, indicators button, alerts button, settings, fullscreen toggle (right) |
| Left toolbar | 48px width, full chart height | left of chart | drawing tools: cursor, trend line, fib retracement, rectangle, text, measure, magnet snap |
| Chart pane | flex-1 (â‰¥60% of non-chrome viewport) | center | `<AstroneumChart>` mounted here; owns all chart rendering |
| Right rail | 260px width, collapsible to 0 | right of chart | watchlist (top), quote summary + P&L (bottom) |
| Bottom panel | 220px height, collapsible to 0, tabs | below chart | tabs: Trading Panel (default), Strategy Tester, Script Editor |

### Behavior

- **Top bar** is fixed-height. Symbol-search pill opens a command-palette-style overlay (see Â§5). Timeframe buttons are mutually exclusive; active gets the Astroneum Blue underline + tint.
- **Left toolbar** is icon-only, vertical. Active tool gets Astroneum Blue icon + 12% tint background. Hover reveals a settings popover for the active drawing (stroke width, color, magnet). Controls `astroneum`'s `drawingBarVisible` + drawing overlays via the library's drawing API.
- **Chart pane** is `<AstroneumChart>`. The library owns all rendering inside this pane â€” candles, indicators, drawing overlays, crosshair, axis. Astroneum adds two read-only overlays on top: the OHLC legend (Â§11, via `EventBus` `crosshair-move`) and the context menu (Â§11, via DOM `contextmenu` on the container). No other chrome inside the pane.
- **Right rail** collapses with a 240ms slide. Collapsed state stores per-user via `serializeState()`. Watchlist row selection drives `chartRef.current.setSymbol()`.
- **Bottom panel** tabs are underline-on-active. Trading Panel tab is always present; Strategy Tester and Script Editor tabs surface the `astroneum/script` `ScriptEngine` and backtest capabilities. Panel collapses to 0 with the same 240ms slide.

### Responsive

- **â‰¥ lg (1024px+):** Full 5-region layout. Chart pane â‰¥60% of viewport.
- **< lg:** Chart pane only. Top bar collapses to symbol-search + timeframe. Left toolbar, right rail, bottom panel hidden. A floating action button opens the right rail as an overlay. Mobile/touch UX is explicitly out of scope for v1 (Â§12).

## 5. Components

Each component ships `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, and `error` states where applicable. Missing states are not shipped.

### Toolbar Button (top bar + left toolbar)
- 3px corner radius. 32px square (top bar) or 36px square (left toolbar).
- Default: transparent, `Ink Muted` icon. Hover: `Surface-Elevated`, `Ink`. Active: `Surface-Elevated`, `Astroneum Blue` icon, 12% `Astroneum Blue Deep` tint. Focus: 2px `Astroneum Blue` ring. Disabled: 40% opacity.

### Symbol Search Pill (top bar)
- 4px radius, 6px / 10px padding, 1px `Hairline Border`. `Surface` background, `Ink` text, search icon left.
- Click opens command-palette overlay (640px max, `Surface-Elevated`, `shadow-floating`). Search input 40px tall. Result rows 36px: symbol + name + muted exchange. Selected: 8% `Astroneum Blue` tint.
- Keyboard: `/` focuses. `Enter` calls `chartRef.current.setSymbol()`.

### Watchlist Row (right rail)
- Transparent, `Ink` symbol + `Ink Muted` last + Sign+Color change%. Hover: `Surface-Elevated`. Selected: 2px `Astroneum Blue` left edge, `Surface` bg.
- 1px `Hairline Border` top divider. 32px row. Tabular-nums on price + change.

### Panel Tab (bottom panel)
- Transparent, `Ink Muted`, 8px / 12px padding. Active: `Ink` text, 2px `Astroneum Blue` bottom border. Hover (inactive): `Ink` text. Underline-on-active, never pill.

### Order / Position Table (Trading Panel tab)
- Header: `Label`, `Ink Muted`, sentence case, 1px bottom `Hairline Border`. Data rows: `Body`/`Numeric`, 1px top `Hairline Border`, 36px dense. Row hover: `Surface-Elevated`. Row selection: 2px `Astroneum Blue` left edge + 8% tint.
- Side pill: transparent, `Profit Teal`/`Loss Coral` text, 1px colored border at 40% alpha. Always paired with `LONG`/`SHORT`.
- Empty state: one `Ink Muted` sentence + a `Secondary` button. No illustration.

### Drawing Tool Popover (left toolbar, hover of active tool)
- `Surface-Elevated`, 4px radius, `shadow-floating`, 1px `Hairline Border`. Stroke width input, color swatches (limited to 7 system colors), magnet toggle, "delete drawing" danger link. Dismiss on `Esc` or outside-click.

### Charts â€” `<AstroneumChart>` options

The chart pane is `<AstroneumChart>` from the `astroneum` npm package. Configuration is via React props + instance methods, NOT widget config flags.

**Mount props** (from `astroneum` API):
- `symbol: SymbolInfo` â€” ticker + precision + description
- `period: Period` â€” `{ multiplier, timespan, text }` e.g. `{ multiplier: 1, timespan: 'hour', text: '1H' }`
- `datafeed: Datafeed` â€” implements `searchSymbols` / `getHistoryData` / `subscribe` / `unsubscribe` (see Â§6)
- `theme: 'dark'` â€” locked to dark in v1
- `locale`, `timezone` â€” UI locale + IANA timezone for X-axis
- `watermark` â€” Astroneum logo SVG (or omit)
- `styles: DeepPartial<Styles>` â€” override the library's dark theme to match this palette exactly
- `drawingBarVisible: boolean` â€” controls the library's left drawing toolbar (default `true`; Astroneum chrome left toolbar is separate)
- `periods: Period[]` â€” timeframes in the period bar
- `mainIndicators: IndicatorDef[]` â€” overlays on the candle pane (e.g. `[{ name: 'EMA', calcParams: [7,25,99] }]`)
- `subIndicators: string[]` â€” sub-pane indicators (e.g. `['VOL']`)
- `plugins: ChartPlugin[]` â€” lifecycle bundles (`onInit` / disposer)
- `accessible: boolean` â€” opts the canvas into screen-reader + keyboard-focus support; `aria-live` announces OHLCV on crosshair changes (the data plumbing for Â§11 OhlcLegend)
- `ariaLabel: string` â€” override the default `"<ticker> <period> chart"` label

**Instance methods** (via `ref`): `setSymbol()`, `setPeriod()`, `setTheme()`, `setLocale()`, `setTimezone()`, `setStyles()`, `getStyles()`, `serializeState()` / `loadState()`.

**EventBus** (`new EventBus<ChartEventMap>()`): `symbol-change`, `period-change`, `crosshair-move`, `zoom`, `data-load`, `tick`, `drawing-start`, `drawing-end`, `theme-change`.

**Subpath modules**: `astroneum/replay` (`BarReplay`), `astroneum/multichart` (`MultiChartLayout`), `astroneum/watchlist` (`WatchlistManager`), `astroneum/portfolio` (`PortfolioTracker`), `astroneum/alerts` (`AlertManager`), `astroneum/script` (`ScriptEngine`), `astroneum/datafeeds/polygon`, `astroneum/datafeeds/crypto` (`createStandardCryptoDatafeed`, `BinanceAdapter`, `BitgetAdapter`, `OkxAdapter`).

### Context Menu (chart pane right-click) â€” see Â§11
### OHLC Legend (chart pane top-left overlay) â€” see Â§11

## 6. The AstroneumChart Mount

The chart pane is `<AstroneumChart>` from the `astroneum` npm package. Astroneum does not embed a TradingView widget; the `astroneum` library IS the chart engine.

### Install
```bash
pnpm add astroneum
```
Declared in `/opt/astroneum/demo/package.json` as `"astroneum": "workspace:*"` (the `astroneum-demo-next` workspace package). Pre-v1.0 today; migrate root imports to subpath imports before v1.0 (root re-exports removed at v1.0 â€” see `astroneum` CHANGELOG). Astroneum is a SEPARATE project from Trading-Bot-V2 â€” do not declare the dependency in the Trading-Bot-V2 repo.

### Mount
```tsx
import { AstroneumChart, EventBus } from '@tony01/astroneum'
import { createStandardCryptoDatafeed } from '@tony01/astroneum/datafeeds/crypto'

const bus = new EventBus()
const datafeed = createStandardCryptoDatafeed({ exchange: 'binance' })

<AstroneumChart
  ref={chartRef}
  symbol={{ ticker: 'BTCUSDT' }}
  period={{ multiplier: 1, timespan: 'hour', text: '1H' }}
  datafeed={datafeed}
  theme="dark"
  locale="en-US"
  timezone="Asia/Bangkok"
  drawingBarVisible={false}   // Astroneum chrome left toolbar is the surface
  periods={[/* 1m, 5m, 15m, 1H, 4H, 1D, 1W */]}
  mainIndicators={[{ name: 'EMA', calcParams: [7, 25, 99] }]}
  subIndicators={['VOL']}
  plugins={[/* ChartPlugin bundles */]}
  accessible
  ariaLabel="BTCUSDT 1-hour candles"
  styles={astPaletteOverride}  // DeepPartial<Styles> matching Â§2 exactly
/>
```

### Lifecycle
- **Symbol / interval change:** call `chartRef.current.setSymbol(next)` or `chartRef.current.setPeriod(next)`. **Do not reboot the component.** The library reloads data via the datafeed and re-renders in place. (This is the key difference from a TV widget embed, which required destroy + re-init.)
- **Unmount cleanup:** dispose the `EventBus` subscribers and any `ChartPlugin` disposers returned from `onInit`. The library handles its own canvas/WebGL teardown.
- **State persistence:** `serializeState()` â†’ `localStorage`; `loadState()` on mount. Covers theme, locale, timezone, symbol, period, styles, indicators, drawing overlays.

### Bridge to app state
Subscribe to `EventBus` events so Astroneum chrome stays in sync with the chart. The demo app manages its own state (it does NOT share Trading-Bot-V2's `useTradingStore` â€” the projects are separate):
- `symbol-change` â†’ update the demo app's symbol state; refresh RightRail details + BottomPanel positions filter.
- `period-change` â†’ route query `?interval=...` (optional, for shareable URLs).
- `crosshair-move` â†’ OhlcLegend overlay update (Â§11).
- `tick` â†’ RightRail last-price + P&L live update.
- `theme-change` â†’ not used in v1 (dark locked), but wired for v2 light theme.

### Bridge from chrome
- Watchlist row click â†’ `chartRef.current.setSymbol({ ticker })`.
- Timeframe button click â†’ `chartRef.current.setPeriod(period)`.
- Indicators button â†’ mutate `mainIndicators` / `subIndicators` state â†’ re-render `<AstroneumChart>`.
- Layout save/load â†’ `serializeState()` / `loadState()`.

### Datafeed
Use `astroneum/datafeeds/crypto` (`createStandardCryptoDatafeed` with `BinanceAdapter` / `BitgetAdapter` / `OkxAdapter`) for 100+ crypto symbols with real-time WebSocket. This is the default. The Astroneum demo app does NOT proxy through Trading-Bot-V2's `/api/binance` â€” the two projects are separate. For exchange keys / account-specific data, implement a custom `Datafeed` (`searchSymbols` / `getHistoryData` / `subscribe` / `unsubscribe`) inside `/opt/astroneum/demo/src/app/api/`.

### Trading & Data Bridge
The Astroneum demo app is **charting-first** â€” it does NOT have a trading API. The only existing API route is `/api/alerts/email` (in `/opt/astroneum/demo/src/app/api/alerts/`). Trading-Bot-V2's `/api/orders`, `/api/portfolio`, `/api/tv-positions`, `/api/webhooks/tradingview` are in a SEPARATE project and are NOT available to Astroneum.

If trading integration is needed in a future version:
- Build new API routes in `/opt/astroneum/demo/src/app/api/` (do not import from Trading-Bot-V2).
- OR use `astroneum/portfolio`'s `PortfolioTracker` (`astroneum/portfolio` subpath) for read-only position/P&L display â€” but it is not an execution path.

For v1, the Trading Panel tab in the bottom panel is charting-only (no order placement). The `OrderPanel` and `OpenPositions` components referenced in the original spec are Trading-Bot-V2's and are NOT reused â€” the demo app builds its own.

## 7. Motion & State

The terminal is sparse on motion. Motion conveys state, never entry.

- **Permitted:** crosshair tracking (library-native via `crosshair-move`), tooltip follow, OHLC legend value updates on crosshair move, panel collapse/expand slide (240ms, the only layout-motion permitted), focus ring appearance, hover background fades (120ms, color-only).
- **Prohibited:** page-entrance fades, card hover lifts (`-translate-y`), card-gradient surfaces, decorative iconography in empty states, animated sparkle, count-up animations on numeric values.
- **Loading:** the chart pane shows nothing until `<AstroneumChart>` mounts; the library renders its own loading state. Surrounding chrome shows skeleton bars (`Surface-Elevated` blocks pulsing at 1.2s) until data resolves.
- **Error:** the affected chrome region shows a single `Ink Muted` sentence with the specific problem and the retry action.

## 8. Accessibility

The keyboard is a first-class input. The terminal is operable without a mouse.

- `/` â€” focuses the symbol search pill.
- `Esc` â€” dismisses every floating layer (search overlay, drawing popover, context menu).
- `1`â€“`9` â€” selects timeframe (TV convention: `1`=1m, `2`=5m, `3`=15m, `4`=30m, `5`=1h, `6`=4h, `7`=1D, `8`=1W, `9`=1M).
- `Cmd/Ctrl-K` â€” opens the app-wide command palette.
- Arrow keys â€” navigate menus, watchlist rows, context menu items.
- `Enter` â€” confirms selection.
- `<AstroneumChart accessible>` â€” opts the canvas into screen-reader + keyboard-focus support: container gets `tabindex=0`, `role="img"`, `aria-label`; a visually-hidden `aria-live="polite"` region announces OHLCV on crosshair changes (throttled ~10/s).
- Focus ring: 2px `Astroneum Blue` offset by 2px `Terminal BG`, via `box-shadow`.
- Color is never the only state channel â€” always paired with sign, label, or icon.

## 9. Do's and Don'ts

### Do:
- **Do** match the `astroneum` library's dark theme exactly. The seam between `<AstroneumChart>` and chrome must be invisible.
- **Do** use Trebuchet MS for UI chrome and Inter with tabular-nums for data.
- **Do** give Astroneum Blue the rarest seat in the house. â‰¤8% of any screen.
- **Do** pair P&L and side semantics with the numeric sign or explicit label.
- **Do** call `chartRef.current.setSymbol()` / `setPeriod()` on change. Do not reboot `<AstroneumChart>`.
- **Do** clean up `EventBus` subscribers and `ChartPlugin` disposers on unmount.
- **Do** keep Astroneum separate from Trading-Bot-V2. The demo app is charting-first; if trading is needed, build new API routes in `/opt/astroneum/demo/src/app/api/` â€” do not import from the Trading-Bot-V2 project.
- **Do** use `astroneum/datafeeds/crypto` (`BinanceAdapter`) as the default datafeed.
- **Do** ship every interactive primitive with default, hover, focus-visible, active, disabled, loading, and error states.

### Don't:
- **Don't** fork the `astroneum` package. Extend via props, `ChartPlugin`, `registerOverlay`, or `IndicatorPlugin`. If the library lacks a feature, file an issue or write a plugin â€” do not patch the source.
- **Don't** embed a TradingView widget. The `astroneum` library IS the chart engine. Mixing TV-widget flags (`hide_top_toolbar`, `hide_legend`, `disable_native_context_menu`) is wrong â€” those flags do not exist on `<AstroneumChart>`.
- **Don't** reboot `<AstroneumChart>` on symbol/interval change. Call the instance methods.
- **Don't** use CryptoBot Console Blue (`#0A21C0`) anywhere in `/astroneum`. Different product, different accent.
- **Don't** use `backdrop-filter: blur` on panels. Glass is reserved for the command-palette overlay.
- **Don't** orchestrate page-entrance animations. Motion conveys state, not entry.
- **Don't** rely on color alone for state. Always pair with sign, label, or icon.
- **Don't** wire trading through `astroneum/portfolio`'s `PortfolioTracker` for execution. The demo app is charting-first; build new API routes in `/opt/astroneum/demo/src/app/api/` if trading is needed â€” do not import from Trading-Bot-V2.

## 10. Project layout & components

Astroneum is a **SEPARATE project** from Trading-Bot-V2. It lives at `/opt/astroneum/` on the server (served at `https://72.62.73.180/astroneum/` via nginx â†’ PM2 `astroneum-demo` on port 3002) and `C:\Users\Joooo\Desktop\Astroneum\` locally. The git remote is `github.com/kowito/astroneum` â€” a different repo from Trading-Bot-V2 (`github.com/Tony1185/trading-bot-v2.git`). Do not mix the two.

### Structure
- `/opt/astroneum/` â€” the `astroneum` charting library (npm package, `src/`, `dist/`, `package.json`).
- `/opt/astroneum/demo/` â€” the `astroneum-demo-next` Next.js 15 app (workspace package, port 3002, the actual terminal served at `/astroneum/`). Dependencies: `astroneum: workspace:*`, `next`, `react@19`.
- `/opt/astroneum/docs/` â€” engine docs (`api.md`, `datafeed-guide.md`, `plugin-development.md`) + this doc + `tv-functions-skill.md`.
- `/opt/astroneum/demo/DESIGN.md` + `PRODUCT.md` â€” the demo app's own product/design docs (companion to this doc).

### Existing demo app components (already built)
The home page (`/opt/astroneum/demo/src/app/page.tsx`) renders `<ChartTerminal />`. The terminal is already scaffolded:
- `src/app/components/ChartTerminal.tsx` â€” the main terminal orchestrator.
- `src/app/components/TerminalShell.tsx` â€” the 5-region shell.
- `src/app/components/MultiChartView.tsx` â€” multi-pane layout.
- `src/app/components/ChartTypeDropdown.tsx` â€” chart-type selector.
- `src/app/components/PatternDialog.tsx` â€” pattern detection dialog.
- `src/app/components/ReplayToolbar.tsx` â€” bar replay controls.
- `src/app/components/ChartDemo.tsx` â€” chart mount demo.
- `src/app/components/panels/WatchlistPanel.tsx` â€” watchlist rail.
- `src/app/components/panels/PineEditorPanel.tsx` â€” Pine-like script editor.
- `src/app/_components/alerts/` â€” `AlertDialog`, `NotificationsDialog`, `Popover`, `ErrorBoundary`.
- `src/app/api/alerts/email/route.ts` â€” the only API route (alerts email).

### Where to add new components
- Chart chrome â†’ `src/app/components/` (existing convention: `ChartTerminal`, `TerminalShell`, etc.).
- Alert/utility components â†’ `src/app/_components/` (existing convention).
- New API routes â†’ `src/app/api/` (build fresh; do not import from Trading-Bot-V2).

### NOT reused from Trading-Bot-V2
The following are in the Trading-Bot-V2 project and are NOT available to Astroneum:
- `useTradingStore`, `OrderPanel`, `OpenPositions`, `TvPositionCard` â€” Trading-Bot-V2 components.
- `/api/orders`, `/api/portfolio`, `/api/tv-positions`, `/api/webhooks/tradingview`, `/api/integrations/tradingview` â€” Trading-Bot-V2 API routes.
- `DashboardLayout`, `globals.css` tokens (`--bg`, `bg-bg`) â€” Trading-Bot-V2 layout/CSS.

The demo app has its own `DESIGN.md` token block, its own `terminal.css` / `panels.css` / `enhancements.css`, and its own component tree. Use `astroneum`'s `formatPrice` / `formatVolume` / `formatPercent` exports (from the library) for symbol-precision-aware formatting â€” do not reach into Trading-Bot-V2's `src/lib/utils.ts`.

## 11. In-Scope Additions (TV-native feel, built on `astroneum` EventBus + DOM)

These two overlays are native Astroneum chrome built on top of `<AstroneumChart>`. They do NOT require any widget config flag â€” the `astroneum` library has no built-in visual legend or context menu, so there is no double-render risk.

### Chart Right-Click Context Menu
Native Astroneum chrome â€” not library-provided. Right-click anywhere on the chart pane opens a context menu styled to the dark palette (`#1E222D` surface, `#2A2E39` hover, `#D1D4DC` ink).
- **Mechanism:** DOM `contextmenu` event listener on the `<AstroneumChart>` container `div` (`e.preventDefault()` + show menu at `e.clientX`/`e.clientY`). No library flag needed.
- **Sections:** Insert indicator, Add alert at cursor price, Trade from here (buy/sell at price), Reset chart, Copy price, Settings.
- **States:** default / hover (`Surface-Elevated`) / disabled (`Ink-Muted`) / with-submenu (chevron right).
- **Divider:** hairline (`#2A2E39`) between logical groups.
- Dismiss on `Esc` or outside-click. Keyboard-navigable (arrow keys, `Enter`).
- **v2-future:** if canvas-coordinate resolution is needed (e.g. "Add alert at cursor price" needs the price at the click point), request a `context-menu` event in `ChartEventMap` from the `astroneum` library. For v1, derive price from the last `crosshair-move` coordinate or the visible-range `Viewport`.

### Crosshair OHLC Legend / Data Window
Top-left overlay inside the chart pane showing live values as the crosshair moves.
- **Mechanism:** subscribe to `EventBus` `'crosshair-move'` event (`Coordinate | null`). On each event, map the coordinate to a bar index, fetch O/H/L/C/V from the chart's bar store, and render the overlay. On `null` (mouse-leave), snap to the last bar.
- **Line 1:** symbol + interval (Trebuchet MS, `Ink`).
- **Line 2:** O H L C values (Inter, tabular-nums) with Sign+Color applied to change (profit teal `#26A69A` / loss coral `#EF5350`).
- **Line 3:** Volume + active `mainIndicators`/`subIndicators` with their current values (via the library's indicator output API).
- No entrance animation (per Â§7).
- **Data plumbing reuse:** the `accessible` prop's `aria-live` OHLCV announcement already does this data extraction for screen readers. The visual OhlcLegend renders the same data in a positioned overlay. No duplication of the data path.
- This is a read-only overlay â€” it does NOT add interactive chrome inside the chart pane beyond the legend (see Â§9 Don'ts).

## 12. Out of Scope for v1

The following surfaces are explicitly **not** part of Astroneum v1. Some are supported by the `astroneum` library but deferred at the APP level for v1 scope; the rest are not in the library.

| Surface | Library supports? | v1 status | Reason |
|---|---|---|---|
| Multi-chart layouts (2Ã—2, 3Ã—1 grid) | YES (`astroneum/multichart`) | Deferred to v1.1 | v1 ships single-pane; layout selector is a follow-up. |
| Compare / overlay / spread symbols | YES (README "Compare/Overlay") | Deferred to v1.1 | Native UX for it deferred. |
| Indicator settings dialog (Inputs/Style/Visibility) | Partial (via `ChartPlugin`) | Deferred | Native modal out of scope; use `mainIndicators`/`subIndicators` props for v1. |
| Full alerts flow (modal, log, drag-to-set) | YES (`astroneum/alerts` `AlertManager`) | Deferred to v1.1 | v1 ships the alerts button only; deep UX deferred. |
| Screener, Heatmaps, Calendars, News, Ideas/social | NO | v2-future | Separate products, not charting features. |
| Broker OAuth connection | NO | v2-future | Astroneum is charting-first; no trading in v1. Build new API routes in `/opt/astroneum/demo/src/app/api/` if trading is needed. |
| On-chart order dragging (drag SL/TP) | NO | v2-future | Needs `context-menu`/`drawing` event integration. |
| Depth of Market (DOM) | YES (README "Depth of Market") | Deferred to v1.1 | Library supports it; APP defers surface. |
| Light theme | YES (`theme="light"`, `high-contrast`) | v2 | Astroneum commits to dark only in v1. |
| Full mobile/touch UX | NO | v2 | v1 collapses to chart-only < lg. |
| Object tree / layers panel | NO | v2-future | Not required for v1 charting-first goal. |
| Logo / brand mark lockup | n/a | separate design pass | Needs dedicated brand work. |

**Moved OUT of deferred (now native via `astroneum` package):** multi-chart, compare/overlay, alerts, script editor (`astroneum/script` `ScriptEngine`), layouts (`serializeState`/`loadState` + `DrawingTemplates`), DOM â€” all library-supported. They remain v1-deferred at the APP surface level (v1.1 follow-up), not blocked on the library.
