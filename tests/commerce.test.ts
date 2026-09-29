import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { parseReport } from '../src/lib/commerce/adapters'
import { deriveAnalytics } from '../src/lib/commerce/analytics'
import { readOnlyQuery } from '../src/lib/commerce/queries'
import type { Snapshot } from '../src/lib/commerce/types'

test('the supported synthetic reports retain their raw columns and rows', () => {
  const amazon = parseReport('Amazon', readFileSync('public/demo/amazon.csv'))
  const noon = parseReport('Noon', readFileSync('public/demo/noon.csv'))
  assert.equal(Object.keys(amazon).length, 22)
  assert.equal(amazon['date/time'].length, 129)
  assert.equal(noon['Order Date'].length, 86)
  assert.ok(amazon.type.includes('Refund'))
  assert.ok(amazon.type.includes('Transfer'))
  assert.ok(noon['Transaction Type'].includes('order_update'))
  assert.ok(noon['Transaction Type'].includes('payment'))
  assert.throws(() => parseReport('Noon', readFileSync('public/demo/amazon.csv')), /layout/)
  assert.throws(() => parseReport('Amazon', new TextEncoder().encode('bad data')), /layout/)
})

test('derived metrics exclude payout transfers and preserve missing source dates', () => {
  const snapshot: Snapshot = {
    summary: [
      {
        marketplace: 'Amazon',
        first_day: '2026-08-01',
        last_day: '2026-08-02',
        rows: 3,
        skus: 1,
        sales: 100,
        fees: -10,
        other: -45,
        settlement: 45,
        payouts: -50,
        commerce_settlement: 95,
      },
      {
        marketplace: 'Noon',
        first_day: '2026-08-02',
        last_day: '2026-08-02',
        rows: 1,
        skus: 1,
        sales: 200,
        fees: -40,
        other: 0,
        settlement: 160,
        payouts: 0,
        commerce_settlement: 160,
      },
    ],
    daily: [{ day: '2026-08-01', marketplace: 'Amazon', sales: 100, settlement: 95 }],
    products: [],
    events: [],
    quality: [],
    concentration: [],
  }
  const result = deriveAnalytics(snapshot)
  assert.equal(result.sales, 300)
  assert.equal(result.fees, -50)
  assert.equal(result.adjustments, 5)
  assert.equal(result.settlement, 255)
  assert.equal(result.payouts, -50)
  assert.equal(result.rows, 4)
  assert.equal(result.periodsDiffer, true)
  assert.equal(result.days[0].Noon, null)
  assert.equal(result.highFee, undefined)
  assert.equal(result.topThree, 0)
  assert.equal(result.metricSources.adjustments[0].amount, 5)
  assert.equal(result.metricSources.settlement[1].amount, 160)
  assert.deepEqual(
    result.bridge.map((step) => step.range),
    [
      [0, 300],
      [300, 250],
      [250, 255],
      [0, 255],
    ],
  )
})

test('SQL preview accepts one read query and rejects write or multi-statement input', () => {
  assert.match(readOnlyQuery('SELECT 1;'), /LIMIT 200$/)
  assert.match(readOnlyQuery('WITH sample AS (SELECT 1 AS n) SELECT * FROM sample'), /WITH sample/)
  assert.throws(() => readOnlyQuery('DELETE FROM commerce_events'), /read-only/)
  assert.throws(() => readOnlyQuery('SELECT 1; SELECT 2'), /read-only/)
})
