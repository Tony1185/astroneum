# Changelog

All notable changes to **astroneum** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
once it reaches v1.0. Until then, minor releases may include breaking changes
— always check this file before upgrading.

## [Unreleased]

## [0.3.0] — 2026-06-15

### Added — v0.5 Polish (partial)

- **Lazy locale loading** ([src/i18n/index.ts](src/i18n/index.ts)) —
  only `en-US` is bundled eagerly; the other 18 locales are loaded on
  demand via dynamic `import()`. New public exports:
  - `loadLocale(key)` — async loader for built-in locales
  - `BUILTIN_LOCALES` — the canonical list
  - Existing `loadLocales(key, dictionary)` continues to work for custom
    translations.
- **Drawing & layout persistence** — `serializeState()` and `loadState(state)`
  on `AstroneumHandle` capture / restore theme, locale, timezone, symbol,
  period, styles, indicators, and overlays as JSON.
  See [docs/api.md](docs/api.md#serializestate--loadstate).
- **Accessibility pass** — opt-in via the new `accessible` prop on
  `<AstroneumChart>`. When enabled, the chart container gets `tabindex=0`,
  `role="img"`, and an `aria-label`; a visually-hidden `aria-live="polite"`
  region announces OHLCV on crosshair changes (throttled to ~10/s).
- **High-contrast theme** — set `theme="high-contrast"` for a
  WCAG-conscious black/white/yellow palette with strong focus rings.
- **Benchmark CI workflow**
  ([.github/workflows/benchmark.yml](.github/workflows/benchmark.yml)) —
  runs `pnpm size` and the perf tests on every PR and posts the perf
  output as a sticky comment.

### Changed

- `WasmIndicators.ts` renamed to **`TypedArrayIndicators.ts`** to match
  what it actually is (a column-store TS implementation). A back-compat
  shim is kept at the old path with `@deprecated` JSDoc and will be
  removed in v1.0.

### Deferred

Still tracked for v0.6 – v1.0; not in this release:

- WebGPU renderer / real Rust + WASM SIMD indicators
- `OrderManager` + broker package
- Heatmap / footprint / options-chain panes
- Full mobile audit & Storybook site
- React component tests (jsdom + RTL) + Playwright visual regression
- Compare overlay UI

---

## [0.2.0] — 2026-05-30

### Added — v0.3 Hardening

- **Subpath exports** for tree-shakeable, opt-in feature modules
  ([#roadmap-4](README.md#v04--modularization)):
  - `astroneum/replay` — `BarReplay`
  - `astroneum/multichart` — `MultiChartLayout`
  - `astroneum/watchlist` — `WatchlistManager`
  - `astroneum/portfolio` — `PortfolioTracker`
  - `astroneum/alerts` — `AlertManager`
  - `astroneum/script` — `ScriptEngine`
  - `astroneum/datafeeds/polygon` — `DefaultDatafeed` + `WebSocketDatafeed`
  - `astroneum/datafeeds/crypto` — `createStandardCryptoDatafeed` + adapters
- **`size-limit` budget** ([.size-limit.json](.size-limit.json)) with one
  budget per entry. Run `pnpm size` after `pnpm build`.
- **Datafeed contract tests** ([src/__tests__/datafeed-contract.test.ts](src/__tests__/datafeed-contract.test.ts))
  — type-level + behavioural checks for any `Datafeed` implementation.
- **SSR smoke tests** ([src/__tests__/ssr-smoke.test.ts](src/__tests__/ssr-smoke.test.ts))
  — verifies the root entry and all subpath entries import cleanly with no
  DOM globals defined, and that the root entry's public API surface is stable.
- **`CONTRIBUTING.md`**, **`SECURITY.md`**, **`CODE_OF_CONDUCT.md`**,
  and this `CHANGELOG.md`.
- **Browser support matrix** documented in [README](README.md#browser-support).

### Changed

- `pnpm verify` order is now `lint → typecheck → build → test` so SSR and
  bundle tests can assert against fresh `dist/` output.
- `tsup.config.ts` now bundles every subpath entry and injects `'use client'`
  into every emitted JS file (not just `dist/index.js`).
- `package.json#files` widened from `dist/*.{js,css,d.ts}` to
  `dist/**/*.{js,css,d.ts}` so nested subpath artifacts ship.

### Fixed

- `src/index.ts` no longer side-imports the non-existent
  `./styles/index.less` (was a leftover from a SCSS migration and caused the
  build to fail outright on a clean install).

---

## [0.2.0-baseline] — 2026-05-30

Initial public roadmap baseline. See git history for details prior to this
changelog being introduced.
