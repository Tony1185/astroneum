/**
 * Back-compat shim for the old `WasmIndicators` module name.
 *
 * The module was renamed to `TypedArrayIndicators` in v0.3.0 — the
 * implementation has always been pure TypeScript (no WASM, no SIMD),
 * and the name was misleading. The real WASM path is tracked under
 * roadmap item #7 in the README.
 *
 * This shim re-exports every symbol so existing imports keep working.
 * Slated for removal in v1.0 — migrate to:
 *
 *   import { sma } from '@/engine/workers/TypedArrayIndicators'
 *
 * @deprecated Import from `TypedArrayIndicators` instead.
 */
export * from './TypedArrayIndicators'
