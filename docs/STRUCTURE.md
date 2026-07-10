# Astroneum — Structure Map

> Living reference for the Astroneum project deployed at **https://72.62.73.180/astroneum/**.
> Documents *what lives where*. For design rationale see `docs/design-astroneum.md`.
> Last updated: **2026-07-10**. Keep this file in sync on every structural change (see §11).

## 1. Overview

| | |
|---|---|
| Name | `astroneum` |
| Version | `0.4.1-beta.2` |
| Description | Professional financial charting library, ready out of the box |
| License | MIT (author `kowito`, repo `github.com/kowito/astroneum`) |
| Stack | TypeScript · React 18/19 peer · ESM-only · Canvas + WebGL/WebGPU · tsup · pnpm |
| Server path | `/opt/astroneum` (owned by `deploy:deploy`) |
| Git on server | Clone of `Tony1185/Astroneum` (fork). `origin` → fork, `upstream` → `kowito/astroneum`. Deploy via `git pull` → build → PM2 restart. |
| Served at | `https://72.62.73.180/astroneum/` (nginx → `127.0.0.1:3002`) |
| Coexistence | Shares host with `trading-bot-v2` (`/opt/trading-bot-v2`, ports 3000/3001). No shared code or DB. |

## 2. Repository layout (`/opt/astroneum`)

```
/opt/astroneum/
├── src/                  # library source (see §3)
├── dist/                 # compiled output: ESM js + astroneum.css + .d.ts + locale chunks (gitignored, build artifact)
├── demo/                 # Next.js showcase app "astroneum-demo-next" (see §5)
├── docs/                 # developer docs (see §9)
├── .opencode/            # AI OS config (fork-only, never PR to upstream)
│   ├── opencode.json     # references (11 docs), permissions, skills path
│   ├── agents/           # 6 subagents: builder, demo-builder, deployer, doc-syncer, parity-checker, auditor
│   ├── commands/         # 5 commands: /deploy, /refresh-structure, /refresh-todo, /verify, /parity-check
│   └── skills/           # 3 skills: conventions, deploy, doc-sync
├── AGENTS.md             # project kernel — auto-loaded by opencode as system prompt
├── .github/workflows/    # CI: auto-version-bump, benchmark, npm-publish
├── ecosystem.config.cjs  # PM2 config for astroneum-demo (see §7)
├── pnpm-workspace.yaml   # workspace: packages=[demo]; allowBuilds: @parcel/watcher, esbuild, sharp
├── package.json          # public package manifest + exports map (see §4)
├── pnpm-lock.yaml
├── tsup.config.ts        # library bundler config (see §6)
├── tsconfig.json
├── eslint.config.js
├── .size-limit.json      # per-entry bundle budgets (see §6)
├── .gitignore
├── check_dist.mjs        # smoke: import dist, check exports
├── check_datafeed.mjs    # smoke: exercise createStandardCryptoDatafeed
├── README.md  CHANGELOG.md  CONTRIBUTING.md  CODE_OF_CONDUCT.md  SECURITY.md  LICENSE  INDICATOR_COMPARISON.md
└── screenshort-1.png  screenshort-2.png   # (sic: "screenshort")
```

## 3. Library source (`src/`)

Root files: `index.ts` (public barrel), `types.ts`, `utils.ts`, `constants.ts`, `react-shared.tsx`, `assets.d.ts`.

### 3.1 `chart/` — high-level chart features (26 modules)
`AstroneumChart.tsx` (main React component), `index.ts`, `hooks.ts`, plus feature modules:
`AlertManager`, `BarReplay`, `ChartTemplateManager`, `CompareOverlay`, `DOMPane`, `DrawingSnapper`, `DrawingTemplates`, `EventBus`, `MultiChartLayout`, `MultiPeriodLayout`, `MultiTimeframe`, `NonTimeBars`, `PatternRecognition`, `PerformanceMode`, `PointAndFigure`, `PortfolioTracker`, `PositionVisualizer`, `PriceScaleTransform`, `SessionVisualizer`, `UndoManager`, `VolumeProfilePlugin`, `WatchlistManager`, `ZigzagPattern`.

### 3.2 `component/` — primitive UI (9 atoms)
Each is a `index.tsx` + `index.scss` pair: `button`, `checkbox`, `empty`, `input`, `list`, `loading`, `modal`, `select`, `switch`. Root `index.tsx` + `index.scss` barrel.

### 3.3 `engine/` — rendering core
Root: `Chart.ts`, `Event.ts`, `Options.ts`, `Store.ts`, `index.ts`.
- `common/` (~45 modules) — renderers & primitives: `Canvas`, `WebGLCanvas`, `SharedIndicatorGLCanvas`, `CandleWebGLRenderer`, `CandleWebGPURenderer`, `CandleWorkerRenderer`, `IndicatorLineWebGLRenderer`, `IndicatorPluginWebGLRenderer`, `IndicatorRectWebGLRenderer`, `TextWebGLRenderer`, `GlyphAtlas`, `candleShaders.ts`; data/coord: `Data`, `DataLoader`, `SymbolInfo`, `Period`, `VisibleRange`, `BarSpace`, `Bounding`, `Coordinate`, `Point`; interaction: `Crosshair`, `EventHandler`, `Eventful`, `Action`, `Animation`, `TickAnimator`, `TaskScheduler`, `Updater`; buffers: `RingBuffer`, `SabRingBuffer`; styling/types: `Styles`, `Nullable`, `DeepPartial`, `DeepRequired`, `PickPartial`, `PickRequired`, `ExcludePickPartial`; `utils/`.
- `component/` — engine-level components: `Axis`, `XAxis`, `YAxis`, `Figure`, `Indicator`, `Overlay`.
- `pane/` — `Pane`, `CandlePane`, `IndicatorPane`, `DrawPane`, `SeparatorPane`, `XAxisPane`, `types.ts`.
- `view/` (22) — render views: `View`, `AxisView`, `XAxisView`, `YAxisView`, `GridView`, `CandleAreaView`, `CandleBarView`, `CandleHighLowPriceView`, `CandleLastPriceLineView`, `CandleLastPriceLabelView`, `CandleTooltipView`, `ChildrenView`, `CrosshairFeatureView`, `CrosshairLineView`, `CrosshairHorizontalLabelView`, `CrosshairVerticalLabelView`, `IndicatorView`, `IndicatorTooltipView`, `IndicatorLastValueView`, `OverlayView`, `OverlayXAxisView`, `OverlayYAxisView`.
- `widget/` — `Widget`, `CandleWidget`, `IndicatorWidget`, `DrawWidget`, `SeparatorWidget`, `XAxisWidget`, `YAxisWidget`, `types.ts`.
- `workers/` — `IndicatorWorkerPool`, `TypedArrayIndicators`, `WasmIndicators`.
- `extension/` — extension registries: `figure`, `i18n`, `indicator`, `overlay`, `styles`, `x-axis`, `y-axis`.

### 3.4 `widget/` — UI modals & bars (11)
Each `index.tsx` + `index.scss` (some with `data.ts`/`types.ts`/`icons/`): `alert-modal`, `drawing-bar` (+`icons/`), `indicator-modal`, `indicator-setting-modal` (+`data.ts`,`types.ts`), `period-bar`, `screenshot-modal`, `script-editor-modal`, `setting-modal` (+`data.ts`), `symbol-search-modal`, `timezone-modal` (+`data.ts`), `watchlist`. Root `index.tsx` + `index.scss`.

### 3.5 `datafeed/` — data transport
`DefaultDatafeed.ts`, `StandardCryptoDatafeed.ts` (Binance/Bitget/OKX USDT), `WebSocketDatafeed.ts`, `WebTransportDatafeed.ts`, `OPFSCache.ts` (off-thread cache), `codec/BarsCodec.ts`, `index.ts`.

### 3.6 `entries/` — subpath entry bundles
`replay.ts`, `multichart.ts`, `watchlist.ts`, `portfolio.ts`, `alerts.ts`, `script.ts`, `datafeeds/polygon.ts`, `datafeeds/crypto.ts`. (Mirror the `exports` map in §4.)

### 3.7 `extension/` — drawing tools (20 + utils + index)
`abcd`, `xabcd`, `arrow`, `circle`, `rect`, `triangle`, `parallelogram`, `pitchfork`, `measure`, `waves`, `gannBox`, `gannFan`, `fibonacciCircle`, `fibonacciExtension`, `fibonacciSegment`, `fibonacciSpeedResistanceFan`, `fibonacciSpiral`; `utils.ts`, `index.ts`.

### 3.8 `scripting/` — `ScriptEngine.ts` (Pine-like scripting runtime).

### 3.9 `store/` — state: `chartStore.ts`, `indicatorStore.ts`, `uiStore.ts`, `index.ts`.

### 3.10 `i18n/` — 18 locales + `format.ts` + `index.ts`
`ar-SA, de-DE, en-US, es-ES, fr-FR, hi-IN, id-ID, it-IT, ja-JP, ko-KR, nl-NL, pl-PL, pt-BR, ru-RU, th-TH, tr-TR, vi-VN, zh-CN`.

### 3.11 Misc
- `plugin/index.ts` — plugin API surface.
- `jsx/` — `jsx-runtime.ts`, `jsx-dev-runtime.ts` (custom JSX runtime; tsconfig `jsxImportSource: @/jsx`).
- `styles/` — `base.scss`, `index.scss` (built to `dist/astroneum.css`).
- `assets/` — `logo.svg`, `iconfonts/{fonts, style.css}`.
- `__tests__/` — `adjustFromTo`, `datafeed-contract`, `pagination`, `persistence`, `plugin`, `script-engine`, `ssr-smoke`, `utils` (`.test.ts`), + `perf/`.

## 4. Public API surface (`package.json` `exports`)

| Subpath | Dist target |
|---|---|
| `astroneum` (`.`) | `dist/index.js` |
| `astroneum/replay` | `dist/entries/replay.js` |
| `astroneum/multichart` | `dist/entries/multichart.js` |
| `astroneum/watchlist` | `dist/entries/watchlist.js` |
| `astroneum/portfolio` | `dist/entries/portfolio.js` |
| `astroneum/alerts` | `dist/entries/alerts.js` |
| `astroneum/script` | `dist/entries/script.js` |
| `astroneum/datafeeds/polygon` | `dist/entries/datafeeds/polygon.js` |
| `astroneum/datafeeds/crypto` | `dist/entries/datafeeds/crypto.js` |
| `astroneum/style.css` | `dist/astroneum.css` |
| `astroneum/package.json` | `./package.json` |

tsup entries (single source of truth for the above): `src/index.ts` + the 8 `src/entries/**` files. All entries ship with `.d.ts`. esbuild strips `'use client'`; `tsup.onSuccess` re-injects it into every emitted `.js` so Next.js App Router treats each entry as a Client Module.

`peerDependencies`: `react` / `react-dom` `^18 || ^19`. `engines.node`: `>=18`.

## 5. Demo app (`demo/` — `astroneum-demo-next`)

Next.js 15 + React 19 showcase. Private workspace package, depends on `astroneum: workspace:*`.

- `package.json` — scripts: `dev`, `build`, `start` (= `next start -p 3002 -H 127.0.0.1`). Deps: `next ^15.3.1`, `react ^19.2`, `astroneum workspace:*`.
- `next.config.ts` — `transpilePackages: ['astroneum']`, `basePath: NEXT_PUBLIC_BASE_PATH` (=`/astroneum` in prod), `trailingSlash: true`, `outputFileTracingRoot: ../`.
- `src/app/` routes (App Router):
  - `layout.tsx`, `page.tsx`, `globals.css`
  - `_components/alerts/` — `AlertDialog`, `ErrorBoundary`, `NotificationsDialog`, `Popover` + `alert-dialog.css`
  - `alerts/page.tsx`
  - `api/alerts/email/route.ts`, `api/alerts/webhook/route.ts`
  - `components/` — `ChartDemo`, `ChartTerminal`, `ChartTypeDropdown`, `CommandPalette`, `DateRangeNavigator`, `ErrorBoundary`, `MultiChartView`, `PatternDialog`, `ReplayToolbar`, `SaveLoadMenu`, `TerminalShell` + `enhancements.css`, `terminal.css`
  - `components/panels/` — `PineEditorPanel`, `WatchlistPanel` + `panels.css`
  - `support/` — `layout.tsx`, `support.css`, `_components/{ArticleBody, Breadcrumb}`, `_lib/{articles/, articles-data.json, data.ts}`, `categories/alerts/page.tsx`, `folders/[folder]/page.tsx`, `solutions/[slug]/page.tsx`
  - `mockDatafeed.ts`, `types/css-imports.d.ts`
- Other: `.env`, `.gitignore`, `.impeccable/`, `.next/` (build out), `DESIGN.md`, `PRODUCT.md`, `README.md`, `next-env.d.ts`, `tsconfig.json`, `package.json.bak.`.

## 6. Build & tooling

- **pnpm workspace** (`pnpm-workspace.yaml`): `packages: [demo]`; `allowBuilds: @parcel/watcher, esbuild, sharp`.
- **package.json scripts**: `clean`, `build:js` (tsup), `build:css` (sass → esbuild bundle/minify, inlines eot/ttf/woff/svg), `build` (clean + js + css), `typecheck` (`tsc --noEmit`), `test` (`tsx --test src/__tests__/*.test.ts`), `test:watch`, `lint` (`eslint src`), `size` (`size-limit`), `verify` (lint+typecheck+build+test), `prepublishOnly` (verify).
- **tsup.config.ts** — `format: ['esm']`, `dts: true`, `splitting: true`, `treeshake: true`, `target: 'esnext'`, `outDir: dist`, `external: ['react','react-dom','react-dom/client','react/jsx-runtime']`; esbuild `jsx: 'automatic'`, alias `@ → ./src`, loaders `.less → empty`, `.svg → text`; `onSuccess` walks `dist/` and prepends `'use client';` to every `.js`.
- **tsconfig.json** — `target/module: ESNext`, `moduleResolution: Bundler`, `jsx: preserve`, `jsxImportSource: @/jsx`, `paths: @/* → ./src/*`, `include: src`, `exclude: src/__tests__`, `noEmit: true` (typecheck only).
- **.size-limit.json** — 9 budgets (ignore react/react-dom): root `200 KB`; `replay`/`multichart`/`script` `15 KB`; `watchlist`/`portfolio`/`alerts` `10 KB`; `datafeeds/polygon`/`datafeeds/crypto` `30 KB`.
- **eslint.config.js** — flat config.
- **Smoke scripts**: `check_dist.mjs` (imports `dist`, asserts `AstroneumChart`, `createStandardCryptoDatafeed`, `STANDARD_CRYPTO_SYMBOLS`); `check_datafeed.mjs` (searchSymbols + bounded history fetch).

## 7. Deployment topology

### nginx (TLS termination, 443/80)
- `:80` → `301` to `https://$host$request_uri`.
- `:443` ssl — cert `/etc/nginx/ssl/server.{crt,key}`, TLS 1.2/1.3.
- Routes:
  - `/astroneum/_next/static/` → `127.0.0.1:3002` — immutable (`max-age=31536000, immutable`)
  - `/astroneum/` → `127.0.0.1:3002` — `no-cache, must-revalidate`
  - `/` → `127.0.0.1:3000` (trading-bot-web, WebSocket upgrade)
  - `/socket.io/` → `127.0.0.1:3001` (trading-bot-ws, WebSocket upgrade)
- Security headers on all blocks: `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy strict-origin-when-cross-origin`, HSTS preload.
- **Caveat:** `sites-enabled/` currently contains **3 overlapping server blocks** for `72.62.73.180` (only the first match wins). Worth consolidating — flag for cleanup.

### PM2 — `astroneum-demo` (`ecosystem.config.cjs`)
| Field | Value |
|---|---|
| name | `astroneum-demo` |
| script | `pnpm` · args `--filter astroneum-demo-next start` |
| cwd | `/opt/astroneum` |
| env | `NODE_ENV=production`, `NEXT_PUBLIC_BASE_PATH=/astroneum`, `NODE_OPTIONS=--max-old-space-size=256`, `TZ=Asia/Bangkok` |
| max_memory_restart | `512M` |
| autorestart / watch | true / false |
| logs | `/home/deploy/.pm2/logs/astroneum-demo-{out,error}.log` |

### Ports
| Port | Bind | Process |
|---|---|---|
| 80 | 0.0.0.0 | nginx (→ 443) |
| 443 | 0.0.0.0 | nginx (TLS) |
| 3000 | 127.0.0.1 | trading-bot-web (Next.js) |
| 3001 | 127.0.0.1 | trading-bot-ws (Socket.io) |
| 3002 | 127.0.0.1 | **astroneum-demo** (Next.js) |

## 8. Build & deploy flow

Library change → demo rebuild → restart (demo only; trading-bot unaffected):

```bash
ssh 72.62.73.180 "cd /opt/astroneum && pnpm build"                                  # 1. lib → dist/ (tsup + css)
ssh 72.62.73.180 "cd /opt/astroneum && pnpm --filter astroneum-demo-next build"     # 2. demo → demo/.next/ (transpilePackages picks up new dist)
ssh 72.62.73.180 "pm2 restart astroneum-demo"                                       # 3. serve
```

- Demo-only change (no lib touch): skip step 1.
- Docs-only change (e.g. this file): no build, no restart.
- Lib `build` runs `pnpm clean` first — wipes `dist/`.

## 9. Docs & meta

| Doc | Role | NOT for |
|---|---|---|
| `STRUCTURE.md` (this file) | Where things live (file tree, deploy, build) | How to use → `api.md` · How to build plugins → `plugin-development.md` |
| `tv-functions-skill.md` | TV→Astroneum function catalog + **authoritative status** | Actionable gaps → `TODO.md` · Design → `TODO-DESIGN.md` |
| `design-astroneum.md` | Library UX spec (colors, typography, layout, motion) | Demo app design → `demo/DESIGN.md` · Status → `TODO-DESIGN.md` |
| `api.md` | API reference (signatures) | How to author plugins → `plugin-development.md` |
| `datafeed-guide.md` | Datafeed how-to | Plugin authoring → `plugin-development.md` |
| `plugin-development.md` | Plugin authoring guide | API signatures → `api.md` |
| `TODO.md` | Actionable function-gap backlog | Status authority → `tv-functions-skill.md` · Design → `TODO-DESIGN.md` |
| `TODO-DESIGN.md` | Design/layout gap backlog | Function gaps → `TODO.md` · Status authority → `tv-functions-skill.md` |
| `INDICATOR_COMPARISON.md` | Indicator parity table (50/50) | Other features → `tv-functions-skill.md` §3 |
| `demo/DESIGN.md` | Demo app design system | Library UX spec → `design-astroneum.md` |
| `demo/PRODUCT.md` | Product framing | Design system → `demo/DESIGN.md` |

- **Root**: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE` (MIT), `INDICATOR_COMPARISON.md`.
- **`.github/workflows/`**: `auto-version-bump.yml`, `benchmark.yml`, `npm-publish.yml`.

## 10. Maintenance policy

This file is the source of truth for *where things live* in the deployed Astroneum project. Update it whenever any of the following change:

- file/dir added / removed / renamed under `src/`, `demo/src/`, `docs/`, `.github/`
- new / renamed export in `package.json` `exports`, or entry in `tsup.config.ts`
- new / changed PM2 process, port, or nginx route
- version bump in `package.json`
- new dependency that changes the public surface
- new locale / widget / component / engine module / extension tool
- build/tooling config edit (`tsup.config.ts`, `tsconfig.json`, `next.config.ts`, `ecosystem.config.cjs`, `.size-limit.json`, `eslint.config.js`)
- docs / meta file added or removed

**Detection model**: the assistant is not always running, so updates happen on invocation — when you ping with a change (or "refresh structure"), re-scan the live tree and patch this file, then append a dated entry to the changelog below. A consistency check (ports, PM2 status, exports vs. entries vs. `dist/` files) runs each refresh.

**Apply**: docs-only edit, no `pnpm build` / `pm2 restart` needed (`docs/*.md` is not served by the demo app).

## 12. Change log

- **2026-07-07** — Initial map generated from live `/opt/astroneum` snapshot: src/ (12 subdirs), demo/ Next.js app, build/tooling, nginx+PM2 topology, docs/meta. Noted: no `.git` on server; 3 overlapping nginx server blocks in `sites-enabled/`.
- **2026-07-07 (b)** — `src/widget/alert-modal` rewritten: now ships full Notifications UX (Webhook URL with SSRF guard + status writeback, in-app, toast, email, plain-text email, sound title/duration, notification schedule, message template, expiration, trigger frequency) using library `Modal`/`Input`/`Checkbox` primitives + `--astroneum-*` tokens. New i18n keys in `en-US.json` + `zh-CN.json` (other 16 locales fall back to en-US). Engine (`AlertManager`) + server relay (`demo/src/app/api/alerts/{webhook,email}/route.ts`) were already capable — this change exposes them in the chart-mounted widget. Also fixed `.alert-section-label` No-Eyebrow Rule violation (was `text-transform: uppercase`). design-astroneum.md section 12 updated.
