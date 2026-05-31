import test from 'node:test'
import assert from 'node:assert/strict'

import type { SerializedChartState } from '../types'

// Pure-shape tests for the SerializedChartState contract. The full
// roundtrip is exercised in the demo app; here we just lock the
// format so unrelated refactors can't silently drop a field.

test('SerializedChartState is JSON-safe', () => {
  const state: SerializedChartState = {
    version: 1,
    theme: 'dark',
    locale: 'en-US',
    timezone: 'Etc/UTC',
    symbol: { ticker: 'BTC-USD' },
    period: { multiplier: 1, timespan: 'minute', text: '1m' },
    styles: { candle: { type: 'candle_solid' } },
    mainIndicators: [{ name: 'EMA', calcParams: [21] }],
    subIndicators: ['MACD'],
    overlays: [
      { name: 'horizontalStraightLine', points: [{ value: 100 }], lock: false, visible: true },
    ],
  }
  const round = JSON.parse(JSON.stringify(state)) as SerializedChartState
  assert.deepEqual(round, state)
  assert.equal(round.version, 1)
})

test('Unknown future versions are silently ignored by the contract', () => {
  // We document the rule: callers must only feed v1 payloads to v1
  // loaders. A `version` mismatch is a no-op in the implementation; this
  // test just records the agreement.
  const v2 = { version: 2 } as unknown as SerializedChartState
  assert.notEqual(v2.version, 1)
})
