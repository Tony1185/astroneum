# Astroneum — TODO & Feature-Gap Backlog

> **Actionable gap index.** One row per gap with status + next action. Shipped items (no gap) are omitted — they live in `docs/tv-functions-skill.md` §3 as `widget-native` / `api-bridged`.
> **Last updated:** 2026-07-08
> Deployed at: `https://72.62.73.180/astroneum/` · Library `astroneum` v0.4.1-beta.2 · Demo app `astroneum-demo-next`
>
> **Authority:** TV-vs-Astroneum status lives in `docs/tv-functions-skill.md` §3 (6-bucket taxonomy). This file is the scannable gap index. When statuses conflict, tv-functions-skill.md wins.
> **Update this file on every functional change** (see §Maintenance).

## How to read

**Status legend**

| Symbol | Meaning |
|---|---|
| ✅ | Shipped and working |
| 🔧 | Partial — exists but incomplete |
| ⏳ | v1-in-scope — spec'd to build now |
| 🟦 | v1.1 — library supports, app surface deferred |
| ⟫ | v2-future — not in v1 |
| ❌ | Missing — not in library or app |
| ⚠️ | Risk / tech debt — needs attention |

**Companion docs (source of truth for detail):**
- `docs/tv-functions-skill.md` — authoritative TV→Astroneum function catalog (§3)
- `docs/STRUCTURE.md` — where things live
- `docs/design-astroneum.md` — UX/UI spec (§11 in-scope, §12 deferred)
- `docs/TODO-DESIGN.md` — design/layout gap backlog
- `INDICATOR_COMPARISON.md` — indicator parity table

---

## 1. Alerts & notifications  →  `tv-functions-skill.md` §3.11

| # | Feature | Status | Gap / next action |
|---|---|---|---|
| 1.5 | Email notify | 🔧 | **Stub** — `demo/src/app/api/alerts/email/route.ts` logs only. Wire Nodemailer/SES + env |
| 1.11 | Indicator-condition alerts | ❌ | Only price alerts today. Extend `AlertManager` to read indicator outputs |
| 1.12 | Drag-to-set price alert line | ❌ | Needs chart drawing integration |
| 1.13 | Alert log/history (server-side) | 🔧 | `/alerts` page reads localStorage only. Needs DB (#8) |
| 1.14 | Alert persistence across devices | ❌ | localStorage only. Needs auth + DB (#8) |

## 2. Webhook (outbound + inbound)  →  `tv-functions-skill.md` §3.12, §4

| # | Feature | Status | Gap / next action |
|---|---|---|---|
| 2.2 | Inbound ingestion (receive TV `alert()` POST) | ❌ | TV-style route + token. Build new in `demo/src/app/api/` (Trading-Bot-V2's route is a separate project — do NOT reuse) |
| 2.3 | Webhook token management | ❌ | UI + API for issue/revoke tokens |
| 2.4 | Delivery log (status, HTTP code, timestamp) | 🔧 | Status shown in UI; not persisted. Needs DB (#8) |
| 2.5 | v21 25-event schema support | ❌ | Reference-only in `tv-functions-skill.md` §3.12. Astroneum has no ingestion to consume them |
| 2.6 | Retry policy config | 🔧 | Hardcoded 1 retry / 3s. Make configurable |

## 3. Pine Script  →  `tv-functions-skill.md` §3.13–3.14

| # | Feature | Status | Gap / next action |
|---|---|---|---|
| 3.4 | `ta.*` subset (sma/ema/rsi/macd/bbands) | 🔧 | Limited set. Expand per §3.14 |
| 3.5 | `strategy()` + `strategy.*` family | ❌ | No backtest runtime. Blocks #4 |
| 3.6 | `request.security` (multi-TF) | ❌ | Library has `resampleBars`/`mtfIndicator` — expose in script |
| 3.7 | `request.financial / quandl / seed / splits / dividends` | ❌ | v2-future |
| 3.8 | `table.new / table.cell / merge_cells` | ❌ | Needed for strategy dashboard (#4) |
| 3.9 | `array.* / matrix.* / map.*` | ❌ | — |
| 3.10 | `label.* / line.* / box.* / plotshape / plotchar / plotcandle / fill / hline / bgcolor / barcolor` | ❌ | Library has overlay/drawing primitives — bridge to script |
| 3.11 | `log.info / warning / error` + console pane | ❌ | No console. Add output pane in `PineEditorPanel` |
| 3.12 | Full `input.*` (color/source/timeframe/symbol/session/text_area/price/time/enum) | 🔧 | Only float/int/string/bool |
| 3.13 | Script library / save / version | ❌ | No persistence. Needs DB (#8) or localStorage |
| 3.14 | Pine v6 features | ❌ | v5 only |
| 3.15 | Monaco/CodeMirror editor (syntax highlight, autocomplete) | 🔧 | Plain textarea. Upgrade editor |

## 4. Strategy Tester & report  →  `tv-functions-skill.md` §3.15–3.16

| # | Feature | Status | Gap / next action |
|---|---|---|---|
| 4.1 | Strategy Tester panel | ❌ | `StrategyTesterPanel` = stub ("No strategy running") |
| 4.2 | Backtest engine (replay trades on history) | ❌ | Needs `strategy()` runtime (#3.5) |
| 4.3 | Performance summary (net profit, PF, expected payoff, B&H, DD, sharpe, sortino) | ❌ | — |
| 4.4 | Trade list (entry/exit/P&L) | ❌ | — |
| 4.5 | Equity curve | ❌ | — |
| 4.6 | Drawdown curve | ❌ | — |
| 4.7 | Trade markers on chart | ❌ | Library has overlay API — add entry/exit arrows |
| 4.8 | Strategy properties (commission/slippage/capital/sizing) | ❌ | Config UI for `strategy()` args |
| 4.9 | 38-row on-chart dashboard | ❌ | Needs `table.*` (#3.8). Spec in §3.16 |
| 4.10 | Currency conversion | ❌ | v2 |

## 5. Trading panel / broker  →  `tv-functions-skill.md` §3.20

| # | Feature | Status | Gap / next action |
|---|---|---|---|
| 5.1 | Trading panel | ❌ | `TradingPanel` = stub ("No broker connected") |
| 5.2 | Paper trading engine | ❌ | Build new in `demo/src/app/api/` (do NOT reuse Trading-Bot-V2) |
| 5.3 | Broker OAuth connections | ❌ | v2-future |
| 5.4 | Order ticket (market/limit/stop/stop-limit) | ❌ | — |
| 5.5 | Positions list | 🔧 | `PortfolioTracker` is read-only display, no execution |
| 5.6 | Orders list (working) | ❌ | — |
| 5.7 | History (filled/closed) | ❌ | — |
| 5.8 | DOM / depth of market surface | 🟦 | Library supports (`domPlugin`); app surface deferred v1.1 |
| 5.9 | On-chart order dragging (SL/TP) | ❌ | v2 — needs drawing event integration |
| 5.10 | Account summary | 🔧 | `PortfolioTracker` read-only |

## 6. Indicators  →  `INDICATOR_COMPARISON.md`

| # | Feature | Status | Gap / next action |
|---|---|---|---|
| 6.2 | Remaining TV indicators (~50 niche) | ❌ | Stoch RSI, AC, CVI, A/D Line, Williams Fractal, BB %B, ALMA, SWMA, TSI, etc. Track in comparison table |
| 6.3 | Community indicators marketplace | ❌ | v2 |
| 6.4 | Indicator templates (save/load presets) | ❌ | `ChartTemplateManager` covers chart state; indicator-only presets missing |
| 6.5 | Indicator settings dialog (Inputs/Style/Visibility tabs) | 🔧 | Partial via `ChartPlugin`. Native modal deferred |

## 7. UX / UI  →  `design-astroneum.md` §11–12, `TODO-DESIGN.md`

| # | Feature | Status | Gap / next action |
|---|---|---|---|
| 7.1 | Chart right-click context menu | ⏳ | v1-in-scope (design §11). Not built. `ContextMenu.tsx` |
| 7.2 | Crosshair OHLC legend / data window | ⏳ | v1-in-scope (design §11). Not built. `OhlcLegend.tsx` |
| 7.3 | TopBar (symbol/timeframe/chart-type/indicators) | 🔧 | Library `PeriodBar` + demo brand bar. Hotkeys: `/` `Alt+A` `Shift+F` `Ctrl+Z/Y`. Undo/redo (`UndoManager`) + Save/Load (`SaveLoadMenu`) wired. Remaining gap: 1.5 `,` interval dropdown (library `PeriodBar` pass). See `TODO-DESIGN.md` §1 |
| 7.4 | LeftToolbar (drawing tools dock) | 🔧 | Library has 20 tools; dock UI partial. See `TODO-DESIGN.md` §2 |
| 7.5 | RightRail (watchlist + details) | ✅ | `SidebarContent` toggle bar (7 tabs) + `WatchlistPanel`/`AlertsPanel`/`StubPanel`. See `TODO-DESIGN.md` §3 |
| 7.6 | Multi-chart grid (2/4/8/16) | ✅ | `LayoutPicker` in demo topbar (1/2/4/8/16). `MultiChartView` renders grid. See `TODO-DESIGN.md` §1.15 |
| 7.7 | Multi-period stacked | 🟦 | Library supports (`MultiPeriodLayout`); app deferred v1.1 |
| 7.8 | Compare / overlay | 🟦 | Library supports (`createCompareIndicator`); app deferred v1.1 |
| 7.9 | Command palette (Cmd/Ctrl-K) | ✅ | `CommandPalette.tsx` — symbol search + timeframe + actions. Ctrl+K wired in demo |
| 7.10 | Object tree / layers panel | ⟫ | v2 |
| 7.11 | Light theme | ⟫ | Library supports; v1 dark-only |
| 7.13 | Full mobile/touch UX | ⟫ | v1 collapses to chart-only <lg |
| 7.14 | Logo / brand mark | ⟫ | Separate design pass |
| 7.15 | Drawing tools (20 vs TV ~50) | 🔧 | Missing: brush/freehand, text/note/label, some fib variants. See `TODO-DESIGN.md` §2 |
| 7.16 | Bottom dock tab bar | ✅ | `DockContent` tab bar (Pine/Strategy/Trading) + collapse toggle. See `TODO-DESIGN.md` §4 |
| 7.17 | Footer date-range navigator | ✅ | `DateRangeNavigator` — 7 presets + live visible-range readout. Engine bridge via `ChartPlugin`. See `TODO-DESIGN.md` §6 |
| 7.18 | Shell collapse persistence + responsive <lg | ✅ | `TerminalShell` sidebar/dock collapse state in `localStorage` key `astroneum:shell` (decoupled from chart `serializeState`). `@media(max-width:1024px)` hides rail, forces sidebar+dock collapsed, slims topbar. FAB overlay deferred v1.1. See `TODO-DESIGN.md` §0 |
| 7.28 | Pattern dialog / auto-detection | 🔧 | `PatternDialog` exists; auto-detection via `zigzagPlugin` |

## 8. DB / persistence / auth  →  (no existing doc — new territory)

| # | Feature | Status | Gap / next action |
|---|---|---|---|
| 8.1 | Database | ❌ | None. All localStorage. Add Postgres/SQLite + Prisma if server-side wanted |
| 8.2 | Server-side alert persistence | ❌ | localStorage only. Blocked on #8.1 |
| 8.3 | Server-side watchlist persistence | ❌ | localStorage only. Blocked on #8.1 |
| 8.4 | Server-side chart template persistence | ❌ | localStorage only. Blocked on #8.1 |
| 8.5 | Trade history persistence | ❌ | Blocked on #8.1 + #5.2 |
| 8.6 | User accounts / auth | ❌ | No auth. Add NextAuth or similar |
| 8.7 | Multi-user support | ❌ | Blocked on #8.6 |
| 8.8 | Server-side state recovery | ❌ | Blocked on #8.1 |

## 9. Structure / deploy / nginx / PM2 / CI  →  `STRUCTURE.md`

| # | Feature | Status | Gap / next action |
|---|---|---|---|
| 9.1 | Git on server | ✅ | Server is now a clone of `Tony1185/Astroneum`. Deploy via `git pull` → build → PM2 restart |
| 9.2 | nginx config cleanup | ⚠️ | 3 overlapping server blocks in `sites-enabled` (STRUCTURE.md §7). Consolidate |
| 9.3 | PM2 stability | ⚠️ | `astroneum-demo` high restart count. Investigate memory/restart loop |
| 9.4 | Automated deploy pipeline | ❌ | Manual ssh + `pnpm build` + `pm2 restart`. Add CI deploy |
| 9.5 | Staging environment | ❌ | Production only |
| 9.6 | Error monitoring (Sentry) | ❌ | — |
| 9.7 | Analytics | ❌ | — |
| 9.8 | CI workflows | 🔧 | `.github/workflows/`: auto-version-bump, benchmark, npm-publish. No deploy / test-on-PR for demo |

## 10. Testing / i18n / datafeeds

| # | Feature | Status | Gap / next action |
|---|---|---|---|
| 10.1 | Library unit tests | 🔧 | 8 test files + perf. No React RTL component tests |
| 10.2 | Playwright visual regression | ❌ | Deferred (CHANGELOG §0.3.0) |
| 10.3 | Mobile audit | ❌ | Deferred |
| 10.4 | Storybook site | ❌ | Deferred |
| 10.5 | i18n — 19 locales | 🔧 | Only en-US + zh-CN carry new alert keys; 16 fall back to en-US. Translate |
| 10.8 | Datafeed — WebTransport (HTTP/3) | 🔧 | Experimental `WebTransportDatafeed` |
| 10.9 | Datafeed — stock/forex/futures (beyond Polygon) | ❌ | — |
| 10.10 | BYO datafeed docs / examples | 🔧 | 4-method interface exists; `datafeed-guide.md` present. More examples |

## 11. Out of scope (v2-future — noted, not tracked)

Not part of v1. Listed for completeness; do not build.

- Screener (stock / crypto / forex / ETF) — `tv-functions-skill.md` §3.18
- Markets: heatmaps, top gainers/losers, sector performance — §3.19
- Economic calendar, earnings / dividends / splits calendars — §3.19
- News feed, ideas / social — §3.19

---

## Maintenance policy

Mirrors `STRUCTURE.md` §10. **Update this file on every functional change.**

### Triggers — re-scan and patch when any of these change

- New / removed / renamed file under `src/`, `demo/src/`, `docs/`
- New / renamed export in `package.json` `exports`, or entry in `tsup.config.ts`
- New indicator / drawing tool / widget / engine module / extension
- New PM2 process, port, or nginx route
- New API route in `demo/src/app/api/`
- New DB table / auth provider / persistence layer
- New locale / i18n key batch
- New CI workflow / deploy step
- Version bump in `package.json`
- Alert / webhook / Pine / strategy / trading feature added or changed
- **When a gap is closed** — remove the row from this file (it graduates to `tv-functions-skill.md` §3 as `widget-native` / `api-bridged`)

### Re-scan model

On invocation ("refresh todo"), re-scan the live tree (`/opt/astroneum` + `demo/`), diff against this file, patch rows, then append a dated entry to the changelog below.

### Consistency check (each refresh)

- Every `❌` / `🔧` row hasn't been silently fixed (if fixed, remove row)
- `INDICATOR_COMPARISON.md` count matches `src/engine/extension/indicator/`
- `package.json` exports match `tsup.config.ts` entries match `dist/` files
- PM2 processes match `ecosystem.config.cjs`
- Cross-links to `tv-functions-skill.md` §3 still resolve
- Cross-links to `TODO-DESIGN.md` still resolve

---

## Changelog

- **2026-07-08 (d)** — §1 top toolbar: undo/redo + save/load (demo-side, no library/`tsup`). `UndoManager` wired: brand-bar buttons + `Ctrl+Z`/`Ctrl+Y`/`Ctrl+Shift+Z` in `ChartTerminal` hotkey effect (input-field guard). `record()` via 600ms poll (`drawing-end` not emitted — `EventBus` defined but uninstantiated, no overlay `ActionType`). New `SaveLoadMenu.tsx` backed by `ChartTemplateManager`: "Unnamed" label + Save-as/Load/Clear/Delete dropdown — folds 1.9/1.16/1.17. Closes `TODO-DESIGN.md` 1.9/1.12/1.13/1.16/1.17. 1.5 (`,` interval dropdown) stays 🔧 — deferred to a library `PeriodBar` pass. Built (6.2s, types valid) + restarted + verified (HTTP 200, undo button SSR-rendered, PM2 error log empty).
- **2026-07-08 (c)** — §0 shell grid/behavior aligned to `design-astroneum.md` §4. Added 7.18 (Shell collapse persistence + responsive <lg) ✅. `globals.css` dimension tokens 48/60/300/300px+200ms → 44/48/260/220px+240ms. Fixed sidebar collapse animation (removed inline `display:none` that defeated the grid-track slide). `TerminalShell` now persists sidebar+dock collapse to `localStorage` `astroneum:shell`. `@media(max-width:1024px)` hides rail + forces sidebar/dock collapsed + slims topbar. FAB overlay deferred v1.1. See `TODO-DESIGN.md` §0 changelog.
- **2026-07-08 (b)** — §1 top toolbar audit + build. Wired 3 modal hotkeys in library `AstroneumChart.tsx`: 1.7 `/` (indicators), 1.10 `Alt+A` (alerts), 1.20 `Shift+F` (fullscreen). Built 7.9 Command palette (Ctrl+K) — `CommandPalette.tsx`: symbol search + timeframe + actions. Promoted 7.6 (multi-chart grid) 🟦→✅ (LayoutPicker already built). Patched `AstroneumHandle` `useImperativeHandle` (local clone behind server). Library + demo rebuilt, deployed, verified.
- **2026-07-08** — Shell regions audit + build. Promoted 7.5 (RightRail) 🔧→✅ (toggle bar already shipped as `SidebarContent`). Added 7.16 (Bottom dock tab bar) ✅ — `DockContent` already shipped. Added 7.17 (Footer date-range navigator) ✅ — built `DateRangeNavigator.tsx`: 7 presets + live visible-range readout, engine bridge via `ChartPlugin`. Deployed + verified.
- **2026-07-07** — Initial draft. Sourced from `STRUCTURE.md`, `tv-functions-skill.md`, `design-astroneum.md`, `INDICATOR_COMPARISON.md`, `CHANGELOG.md`, and live source (`/opt/astroneum` + `demo/`). 8 gap sections + out-of-scope + maintenance policy. ~110 rows (full mirror).
- **2026-07-07 (b)** — Refactored to gap-only index. Dropped ~50 no-gap ✅ rows (they live in `tv-functions-skill.md` §3 as `widget-native`/`api-bridged`). Stripped redundant "TV" column. Added authority note deferring to `tv-functions-skill.md` §3. ~85 gap rows remain. Cross-linked to `TODO-DESIGN.md` for design/layout gaps.
