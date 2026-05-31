# Astroneum

Professional financial charting library for React applications.

[![npm version](https://img.shields.io/npm/v/astroneum?label=npm)](https://www.npmjs.com/package/astroneum)
[![npm downloads](https://img.shields.io/npm/dm/astroneum)](https://www.npmjs.com/package/astroneum)
[![React 18-19](https://img.shields.io/badge/react-18%20%7C%2019-149eca)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-ready-3178c6)](https://www.typescriptlang.org/)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-339933)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

![Astroneum chart — dark theme with EMA, MACD, RSI and volume indicators](screenshort-1.png)

![Astroneum chart — dark theme with multi-pane indicators](screenshort-2.png)

## Features

- **Candlestick, bar, area, and line** chart types rendered via Canvas2D / WebGL2
- **20+ built-in indicators** — MA, EMA, BOLL, MACD, RSI, KDJ, and more
- **Custom indicator plugins** via `registerIndicatorPlugin` with optional WebGL2 render path
- **Drawing tools** — trend lines, Fibonacci, Gann, pitchfork, Elliott waves, and more; with snap, templates, and undo/redo
- **Off-main-thread indicator calculations** using a Web Worker pool and TypedArray column store
- **OPFS historical cache** — persists fetched bar data in the Origin Private File System for instant repeat loads
- **FlatBuffers binary codec** (`BarsCodec`) for efficient bar serialisation
- **Bar replay** mode with controllable playback speed
- **Multi-chart layout** for side-by-side symbol comparison
- **Alert manager**, **watchlist**, **portfolio tracker**
- **Script editor** — write custom indicators in a sandboxed JS environment
- **19 built-in locales**; fully customisable dark/light theme and styles
- Tree-shakeable ESM, fully typed TypeScript

---

## Install

```bash
npm install astroneum
```

`react` and `react-dom` ≥ 18 are peer dependencies.

## Runtime Requirements

- Browser (uses `window`, `document`, Canvas, WebSocket, `localStorage`)
- React 18+ or 19
- ESM-compatible bundler
- Import styles from `astroneum/style.css`

## Browser Support

The library targets the **last two stable releases** of evergreen browsers
on the desktop and the **current major** on mobile.

| Browser | Minimum | Notes |
| ------- | ------- | ----- |
| Chrome / Edge (Chromium) | 110+ | Full WebGL2 + OPFS bar cache. |
| Firefox | 115+ | Full WebGL2. OPFS support varies — falls back to in-memory cache. |
| Safari (desktop) | 16.4+ | Full WebGL2. OPFS available on 17+. |
| Safari (iOS / iPadOS) | 16.4+ | Touch + pinch supported. |
| Chrome for Android | last 2 | |

Older browsers may load the library but will silently downgrade:

- No WebGL2 → Canvas2D fallback for both the renderer and indicator
  overlays (`renderGL` plugins use `render2D`).
- No OPFS → bar cache stays in-memory only.
- No `OffscreenCanvas` → indicator worker pool reverts to main-thread
  calculation.
- No `WebTransport` → `WebTransportDatafeed` is unavailable; use
  `WebSocketDatafeed` instead.

**Node SSR:** the package is safe to import in a Next.js App Router
server pass. It carries `'use client'` on every emitted entry and does not
touch DOM globals during module evaluation
(enforced by [src/__tests__/ssr-smoke.test.ts](src/__tests__/ssr-smoke.test.ts)).

## How To Use

1. Install `astroneum` and ensure your app already provides `react` and `react-dom`.
2. Create one datafeed instance for the chart lifetime. For live crypto futures, use `createStandardCryptoDatafeed(...)`.
3. Render `AstroneumChart` with a `symbol`, `period`, and `datafeed`.
4. Keep symbol and period in your own React state, then update the chart through the ref with `setSymbol(...)` and `setPeriod(...)` when the user changes them.
5. If you use the built-in crypto feed, listen for `DATAFEED_ERROR_EVENT` so unsupported symbols or feed failures show a real error instead of fake fallback data.

## Release Automation

This repository includes automated version bumping and npm publishing through GitHub Actions.

- Workflow: `.github/workflows/auto-version-bump.yml`
- Publish workflow: `.github/workflows/npm-publish.yml`
- Auto trigger: every push to `main`
- Manual trigger: Actions tab → Auto Version Bump → Run workflow

Default behavior on push:

- Runs `npm version prerelease --preid beta --no-git-tag-version`
- Installs dependencies and runs `pnpm verify`
- Publishes the package to npmjs from the same workflow run
- Commits updated version files with a skip-ci commit message
- Creates and pushes a matching git tag (`v<version>`)
- Prerelease versions publish to their prerelease dist-tag such as `beta`; stable versions publish to `latest`

The separate tagged publish workflow remains available for manual runs or tags pushed by a human, but the main branch release path no longer depends on a second workflow being triggered by an Actions-created tag.

Manual run supports these bump types:

- prerelease
- patch
- minor
- major

Repository secret required:

- `NPM_TOKEN` with publish access to the `astroneum` package on npmjs

---

## Quick Start

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import {
	AstroneumChart,
  DATAFEED_ERROR_EVENT,
	createStandardCryptoDatafeed,
	STANDARD_CRYPTO_SYMBOLS,
	type AstroneumHandle,
  type DatafeedErrorDetail,
  type Period,
  type SymbolInfo,
} from 'astroneum'
import 'astroneum/style.css'

const PERIODS: Period[] = [
  { multiplier: 1, timespan: 'minute', text: '1m' },
  { multiplier: 5, timespan: 'minute', text: '5m' },
  { multiplier: 1, timespan: 'hour', text: '1H' },
] 

export default function App() {
  const chartRef = useRef<AstroneumHandle>(null)
  const datafeed = useMemo(() => createStandardCryptoDatafeed({ smoothingDuration: 320 }), [])
  const [symbol, setSymbol] = useState<SymbolInfo>(STANDARD_CRYPTO_SYMBOLS[0])
  const [period, setPeriod] = useState<Period>(PERIODS[0])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onDatafeedError = (event: Event): void => {
      const detail = (event as CustomEvent<DatafeedErrorDetail>).detail
      if (!detail || detail.ticker !== symbol.ticker) return
      setError(detail.message)
    }

    window.addEventListener(DATAFEED_ERROR_EVENT, onDatafeedError)
    return () => window.removeEventListener(DATAFEED_ERROR_EVENT, onDatafeedError)
  }, [symbol.ticker])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select
          value={symbol.ticker}
          onChange={event => {
            const next = STANDARD_CRYPTO_SYMBOLS.find(item => item.ticker === event.target.value)
            if (!next) return
            setSymbol(next)
            setError(null)
            chartRef.current?.setSymbol(next)
          }}
        >
          {STANDARD_CRYPTO_SYMBOLS.map(item => (
            <option key={item.ticker} value={item.ticker}>{item.ticker}</option>
          ))}
        </select>

        {PERIODS.map(item => (
          <button
            key={item.text}
            onClick={() => {
              setPeriod(item)
              setError(null)
              chartRef.current?.setPeriod(item)
            }}
          >
            {item.text}
          </button>
        ))}
      </div>

      {error && <div style={{ marginBottom: 12, color: '#c62828' }}>{error}</div>}

      <AstroneumChart
        ref={chartRef}
        symbol={symbol}
        period={period}
        datafeed={datafeed}
        theme="dark"
        subIndicators={['VOL']}
        style={{ width: '100%', height: 560 }}
      />
    </div>
  )
}
```

The important part is to create the datafeed once with `useMemo`, keep `symbol` and `period` in React state, and only use the ref for imperative updates when the user changes them.

## Next.js Usage

### 1. Configure `next.config.ts`

Astroneum is an ESM-only package — add it to `transpilePackages` so Next.js bundles it correctly:

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['astroneum'],
}

export default nextConfig
```

### 2. Import the CSS globally

Add the stylesheet once in your root layout:

```tsx
// app/layout.tsx
import 'astroneum/style.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

### 3. Use the chart

The library ships with `'use client'` built in, so you can import it directly in any component file — no extra directive or dynamic import needed:

```tsx
// app/components/Chart.tsx
import { useMemo, useRef } from 'react'
import {
	AstroneumChart,
	createStandardCryptoDatafeed,
	STANDARD_CRYPTO_SYMBOLS,
	type AstroneumHandle,
} from 'astroneum'

export default function Chart() {
  const chartRef = useRef<AstroneumHandle>(null)
  const datafeed = useMemo(() => createStandardCryptoDatafeed({ smoothingDuration: 320 }), [])

  return (
    <AstroneumChart
      ref={chartRef}
      symbol={STANDARD_CRYPTO_SYMBOLS[0]}
      period={{ multiplier: 1, timespan: 'minute', text: '1m' }}
			datafeed={datafeed}
      locale="en-US"
      subIndicators={['VOL']}
      style={{ width: '100%', height: 560 }}
    />
  )
}
```

Then use it from any Server or Client Component page:

```tsx
// app/page.tsx
import Chart from './components/Chart'

export default function Page() {
  return <Chart />
}
```



## Datafeed Interface

For a ready-to-use live feed, use Astroneum's built-in standard crypto implementation:

```ts
import {
	DATAFEED_ERROR_EVENT,
	STANDARD_CRYPTO_SYMBOLS,
	createStandardCryptoDatafeed,
	type DatafeedErrorDetail,
} from 'astroneum'

const datafeed = createStandardCryptoDatafeed({ smoothingDuration: 320 })

window.addEventListener(DATAFEED_ERROR_EVENT, event => {
	const detail = (event as CustomEvent<DatafeedErrorDetail>).detail
	console.error(detail.message)
})

const symbol = STANDARD_CRYPTO_SYMBOLS[0]
```

This built-in feed ships with live Binance USD-M, Bitget USDT futures, and OKX swap routing. If a symbol or period is unsupported, it emits `DATAFEED_ERROR_EVENT` and returns no mock fallback data.

Implement the `Datafeed` interface to connect any data source:

```ts
import type {
  Datafeed,
  SymbolInfo,
  Period,
  CandleData,
  DatafeedSubscribeCallback
} from 'astroneum'

const myDatafeed: Datafeed = {
  async searchSymbols(search?: string): Promise<SymbolInfo[]> {
    return []
  },
  async getHistoryData(
    symbol: SymbolInfo,
    period: Period,
    from: number,
    to: number
  ): Promise<CandleData[]> {
    // fetch and return OHLCV bars
    return []
  },
  subscribe(symbol: SymbolInfo, period: Period, callback: DatafeedSubscribeCallback): void {
    // stream realtime ticks
  },
  unsubscribe(symbol: SymbolInfo, period: Period): void {
    // stop stream
  }
}
```

**See [docs/datafeed-guide.md](docs/datafeed-guide.md) for:**
- 3 complete patterns: minimal mock → REST API → WebSocket
- Real-world examples (Binance, custom REST API)
- Tips on error handling, caching, and smooth real-time streaming

`DefaultDatafeed` (exported from `astroneum`) is a Polygon.io REST + WebSocket implementation and requires a Polygon API key.

`createStandardCryptoDatafeed` (exported from `astroneum`) provides a ready-to-use multi-exchange crypto futures feed (Binance, Bitget, OKX) with strict live-only routing and error events via `DATAFEED_ERROR_EVENT`.

---

## Custom Indicator Plugins

```ts
import { registerIndicatorPlugin, type IndicatorPlugin, type CandleData } from 'astroneum'

const spread: IndicatorPlugin<number> = {
  name: 'SPREAD',
  shortName: 'Spread',
  calcParams: [],
  calc(data: CandleData[]) {
    return data.map(c => c.high - c.low)
  }
}

registerIndicatorPlugin(spread)
// then mount it through a ChartPlugin or another chart lifecycle hook
```

Plugins that define `renderGL` run on a dedicated WebGL2 layer with a per-indicator VBO.  
`render2D` is used as Canvas2D fallback when WebGL2 is unavailable.

### Per-chart plugin mounting

```ts
import { type ChartPlugin } from 'astroneum'

const plugin: ChartPlugin = {
  name: 'my-plugin',
  indicators: [{ name: 'SPREAD', calc(data) { return data.map(c => c.high - c.low) } }],
  onInit({ chart }) {
    chart.createIndicator('SPREAD', true)
    return () => { chart.removeIndicator({ name: 'SPREAD' }) }
  }
}

<AstroneumChart plugins={[plugin]} ... />
```

---

## AstroneumHandle (ref API)

```ts
interface AstroneumHandle {
  setTheme(theme: string): void
  getTheme(): string
  setStyles(styles: DeepPartial<Styles>): void
  getStyles(): Styles
  setLocale(locale: string): void
  getLocale(): string
  setTimezone(timezone: string): void
  getTimezone(): string
  setSymbol(symbol: SymbolInfo): void
  getSymbol(): SymbolInfo
  setPeriod(period: Period): void
  getPeriod(): Period
  getDataListLength(): number
  getLastDataTimestamp(): number | null
}
```

---

## Locale Support

19 built-in locales: `en-US`, `zh-CN`, `ja-JP`, `ko-KR`, `de-DE`, `fr-FR`, `es-ES`, `pt-BR`, `ru-RU`, `ar-SA`, `hi-IN`, `tr-TR`, `nl-NL`, `pl-PL`, `it-IT`, `vi-VN`, `th-TH`, `id-ID`.

Override or add locales with `loadLocales(key, dictionary)`.

---

## Main Exports

| Export | Description |
| ------ | ----------- |
| `AstroneumChart` | Main React chart component |
| `DefaultDatafeed` | Polygon.io REST + WebSocket datafeed |
| `createStandardCryptoDatafeed` | Built-in Binance/Bitget/OKX live crypto datafeed |
| `STANDARD_CRYPTO_SYMBOLS` | Default symbol list for the standard crypto datafeed |
| `DATAFEED_ERROR_EVENT` | Browser event name for datafeed errors (`CustomEvent<DatafeedErrorDetail>`) |
| `MultiChartLayout` | Side-by-side multi-symbol layout |
| `BarReplay` | Bar replay controller |
| `DrawingTemplates` | Save/load drawing templates |
| `AlertManager` | Price alert management |
| `ScriptEngine` | Sandboxed indicator scripting |
| `WatchlistManager` | Symbol watchlist |
| `PortfolioTracker` | Portfolio P&L tracker |
| `PerformanceMode` | Adaptive quality / performance controls |
| `loadLocales` | Register locale dictionaries |
| `registerIndicatorPlugin` | Register custom indicator plugin |
| `registerIndicator` | Register engine-level indicator template |
| `EventBus` | Cross-chart event bus |
| `TickAnimator` | Smooth real-time tick animation helper |
| `RingBuffer` | Circular OHLCV ring buffer |
| `formatPrice`, `formatVolume`, `formatPercent`, … | Formatting utilities |

### Subpath Exports (v0.4)

For smaller bundles, import optional features from a dedicated subpath
instead of the root entry. Each subpath ships its own `'use client'` chunk
and is tree-shakeable independently.

| Subpath | Exports |
| ------- | ------- |
| `astroneum/replay` | `BarReplay`, `BarReplayOptions`, `BarReplayState` |
| `astroneum/multichart` | `MultiChartLayout`, `MultiChartCount`, `MultiChartSlot`, `MultiChartLayoutOptions` |
| `astroneum/watchlist` | `WatchlistManager`, `Watchlist`, `WatchSymbol` |
| `astroneum/portfolio` | `PortfolioTracker`, `Position`, `PositionSide`, `PnLResult` |
| `astroneum/alerts` | `AlertManager`, `Alert`, `AlertCondition`, `AlertStatus`, `AlertFrequency`, `AlertCreate`, `AlertCheckInput`, `AlertTriggeredCallback` |
| `astroneum/script` | `ScriptEngine`, `CompiledIndicator`, `StudyOptions`, `PlotOptions`, `InputOptions` |
| `astroneum/datafeeds/polygon` | `DefaultDatafeed`, `WebSocketDatafeed`, `WebSocketDatafeedOptions` |
| `astroneum/datafeeds/crypto` | `createStandardCryptoDatafeed`, `StandardCryptoDatafeed`, `STANDARD_CRYPTO_SYMBOLS`, `DATAFEED_ERROR_EVENT`, `BinanceAdapter`, `BitgetAdapter`, `OkxAdapter`, plus types |

```ts
import { BarReplay } from 'astroneum/replay'
import { createStandardCryptoDatafeed } from 'astroneum/datafeeds/crypto'
```

The same symbols remain re-exported from the root `astroneum` entry for
backwards compatibility — choose the subpath when you want to keep the
chart core small or use a feature in isolation (e.g. a headless replay
worker that never mounts the React chart).

Bundle budgets per entry are enforced by `pnpm size`
([.size-limit.json](.size-limit.json)).

---

## API Docs

Full API reference: [docs/api.md](docs/api.md)

---

## Project Analysis

A snapshot of where the library is strong today and where the largest gaps sit.
This drives the roadmap below.

### Strengths

- Broad feature surface: candles/bar/area/line, 20+ indicators, drawing tools,
  multi-chart, bar replay, alerts, watchlist, portfolio, script engine.
- Solid performance foundation: TypedArray column store (`packBars`), Web Worker
  indicator pool, OPFS bar cache, FlatBuffers wire codec, `TickAnimator`,
  ring buffer, `PerformanceMode` adaptive quality.
- Modern React story: React 18 + 19 support, `'use client'` baked in, ESM-only,
  tree-shakeable, fully typed.
- 19 built-in locales and pluggable theming via `setStyles` / `setTheme`.
- Pluggable indicator system with optional WebGL2 render path
  (`registerIndicatorPlugin` + `ChartPlugin`).

### Gaps & Risks

- **Tests are thin.** Only [src/__tests__](src/__tests__) — 4 unit files plus a
  perf baseline. No React component tests, no datafeed tests, no rendering /
  hit-testing tests, no SSR smoke test.
- **No release hygiene docs.** `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`,
  and `CODE_OF_CONDUCT.md` are all missing.
- **Bundle size is unmeasured.** No `size-limit` budget, no per-feature subpath
  exports — heavy optional surfaces (`BarReplay`, `MultiChartLayout`,
  `WatchlistManager`, `PortfolioTracker`, `ScriptEngine`, `DefaultDatafeed`)
  all ship from the single `astroneum` entry.
- **Locales are bundled together.** All 19 JSON dictionaries in
  [src/i18n](src/i18n) are statically imported, so a Thai-only app still ships
  Arabic, Hindi, etc.
- **`WasmIndicators` is misnamed.** [src/engine/workers/WasmIndicators.ts](src/engine/workers/WasmIndicators.ts)
  is pure TypeScript — no WASM, no SIMD. Either rename or ship a real WASM/SIMD
  path.
- **No WebGPU renderer** despite `@webgpu/types` being a dev dependency.
- **Datafeed coupling.** `DefaultDatafeed` hard-codes Polygon.io and lives in
  the core bundle. Only crypto-futures adapters exist
  ([src/datafeed/StandardCryptoDatafeed.ts](src/datafeed/StandardCryptoDatafeed.ts))
  — no stocks, forex, or options reference adapters.
- **Accessibility is partial.** Modal traps focus and the watchlist has
  `aria-*`, but the chart canvas itself has no keyboard navigation, no
  screen-reader summary, and no documented contrast guarantees.
- **Drawing persistence is implicit.** No first-class
  `serialize()`/`deserialize()` for drawings + indicator layouts on
  `AstroneumHandle`.
- **No live documentation site / Storybook.** The demo is a single Next.js page;
  there is no component playground or per-feature showcase.
- **No benchmark CI.** The perf baseline exists locally but isn't run on PRs.
- **Pre-1.0 with no stability statement.** Public API can break without notice.

---

## Roadmap

Numbered to match priority. Anything in v1.0 is considered a blocker for the
stable release. See [CHANGELOG.md](CHANGELOG.md) for what has shipped.

### v0.3 — Hardening (partially shipped)

1. **Testing**
   - [ ] React component tests for `AstroneumChart` (mount, ref API, theme/locale
         switching) using `@testing-library/react` + `jsdom`. Deferred to v0.5.
   - [x] **Datafeed contract tests** — see [src/__tests__/datafeed-contract.test.ts](src/__tests__/datafeed-contract.test.ts).
   - [x] **SSR smoke test** — root + every subpath import asserted in
         [src/__tests__/ssr-smoke.test.ts](src/__tests__/ssr-smoke.test.ts).
   - [ ] Visual-regression smoke test (Playwright + pixel diff). Deferred to v0.5.
2. **Release hygiene**
   - [x] [CHANGELOG.md](CHANGELOG.md) (Keep-a-Changelog format).
   - [x] [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md),
         [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
   - [x] **Supported browser matrix** — see [Browser Support](#browser-support).
3. **Bundle visibility**
   - [x] **`size-limit` budget** per entry — [.size-limit.json](.size-limit.json).
         Run `pnpm size` after `pnpm build`.
   - [ ] Publish a bundle-analysis artifact from CI. Deferred to v0.5.

### v0.4 — Modularization (shipped)

4. [x] **Subpath exports** — see [Subpath Exports](#subpath-exports-v04).
       Eight new entry points: `astroneum/replay`, `/multichart`, `/watchlist`,
       `/portfolio`, `/alerts`, `/script`, `/datafeeds/polygon`, `/datafeeds/crypto`.
5. [x] **Lazy locales.** Only `en-US` is bundled eagerly; the other 18 locales
       load on demand via `loadLocale(key)` (dynamic `import()`). See
       [src/i18n/index.ts](src/i18n/index.ts).
6. [ ] **Datafeed split (full).** The reference datafeeds are now reachable
       via subpath but are still re-exported from the root entry for backwards
       compatibility. The root re-export will be removed in v1.0.

### v0.5 — Performance & Rendering (partial)

7. [x] **Renamed `WasmIndicators` → `TypedArrayIndicators`.** A back-compat
       shim re-exports from the old path with `@deprecated` JSDoc and will be
       removed in v1.0. A real WASM+SIMD build is still on the wishlist.
8. [ ] **WebGPU renderer (experimental).** Add an optional WebGPU candle renderer
       behind `PerformanceMode`, with automatic WebGL2 → Canvas2D fallback.
9. [x] **Benchmark CI.** [.github/workflows/benchmark.yml](.github/workflows/benchmark.yml)
       runs `pnpm size` and the perf tests on every PR and posts the perf
       output as a comment.
10. [ ] **Backpressure SLA.** Document and enforce a max tick rate per pane; expose
    `TickAnimator` tuning knobs through `AstroneumChart` props.
11. [ ] **React component + visual regression tests.** Pulled forward from v0.3.

### v0.6 — UX, Accessibility, Persistence (partial)

13. [x] **Chart accessibility (opt-in).**
    - `accessible` prop makes the canvas focusable (`tabindex=0`, `role="img"`,
      `aria-label`).
    - Cursor OHLCV is announced through a polite `aria-live` region (throttled).
    - High-contrast theme variant ships under `theme="high-contrast"`.
    - Keyboard pan/zoom shortcuts are still tracked for v0.7.
14. [x] **Drawing & layout persistence.** `serializeState()` and
    `loadState(state)` on `AstroneumHandle` cover drawings, indicators, theme,
    locale, timezone, symbol, period, and styles. A `useChartStateSync` React
    helper is still tracked for v0.7.
15. [ ] **Mobile / touch polish.** Audit pinch-zoom, two-finger pan, long-press
    context menu, and drawing handles on small screens.
16. **Order entry hooks.** Optional `OrderManager` surface with horizontal
    price lines, drag-to-edit handles, and a pluggable broker interface
    (no built-in broker integration).

### v0.7 — New Visualizations

17. **Heatmap / depth of market** pane.
18. **Footprint / market-profile** chart type.
19. **Options chain** strip and IV-surface helper.
20. **Compare overlay** — multiple symbols normalized on one pane (separate
    from `MultiChartLayout`).

### v1.0 — Stability

21. **Public API freeze.** Lock the `astroneum` top-level entry and every
    `astroneum/*` subpath; adopt strict semver and an `@deprecated` policy
    with a one-minor deprecation window. Remove the root re-exports of
    `BarReplay`, `MultiChartLayout`, `WatchlistManager`, `PortfolioTracker`,
    `AlertManager`, `ScriptEngine`, `DefaultDatafeed`, and the crypto
    datafeed — consumers must use the subpaths.
22. **Live documentation site.** Storybook (or Ladle) with one story per
    public component + per feature module, deployed from CI.
23. **Reference broker adapter** built on the `OrderManager` interface,
    shipped as a separate `@astroneum/broker-paper` package.
24. **Performance budget published** (e.g. "60 fps with 5 indicators on
    100K bars on a 2020 MacBook Air") and enforced by benchmark CI.

### Nice-to-have / Backlog

- Server-side rendering of a static snapshot to PNG/SVG (for emails, OG
  images).
- AI helper: indicator-from-natural-language compiled through `ScriptEngine`.
- Drawing collaboration (CRDT / Yjs) over the existing `EventBus`.
- Additional asset classes: equities, futures, FX reference datafeeds.
- React Native (Skia) renderer experiment.

---

## License

MIT © kowito
