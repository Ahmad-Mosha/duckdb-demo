import { mkdir, writeFile } from 'node:fs/promises'

const products = [
  ['LAMP-01', 690],
  ['MUG-02', 340],
  ['DESK-03', 1190],
  ['BAG-04', 890],
  ['CABLE-05', 220],
  ['STAND-06', 540],
]

const csv = (rows) =>
  rows
    .map((row) =>
      row
        .map((value) => {
          const s = String(value ?? '')
          return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
        })
        .join(','),
    )
    .join('\n') + '\n'
const money = (n) => n.toFixed(2)
const iso = (day) => `2026-08-${String(day).padStart(2, '0')}`
const amazonDate = (day) => `${day} Aug 2026 10:30:00 GMT+2`

const amazon = [
  ['Includes Amazon Marketplace, Fulfillment by Amazon (FBA), and Amazon Webstore transactions'],
  ['All amounts in local currency, unless specified'],
  ['Definitions:'],
  ['date/time: posted date/time of the transaction'],
  ['Selling fees: Includes variable closing fees and referral fees.'],
  ['Other transaction fees: Includes shipping chargebacks.'],
  ['Other: Includes non-order transaction amounts.'],
  ['Synthetic demonstration data.'],
  [
    'date/time',
    'settlement id',
    'type',
    'order id',
    'sku',
    'description',
    'quantity',
    'marketplace',
    'fulfillment',
    'order city',
    'order state',
    'order postal',
    'product sales',
    'shipping credits',
    'promotional rebates',
    'selling fees',
    'fba fees',
    'other transaction fees',
    'other',
    'total',
    'Transaction Status',
    'Transaction Release Date',
  ],
]
const noon = [
  [
    'Contract',
    'Contract Title',
    'Reference Nr',
    'Order Nr',
    'Item Nr',
    'Order Date',
    'Transaction Date',
    'Title',
    'SKUs',
    'Partner SKUs',
    'Transaction Type',
    'Currency',
    'Net Proceeds',
    'Referral Fee including VAT',
    'Fullfilment & Logistics Fees including VAT',
    'Shipping Credits including VAT',
    'Other Order Fees including VAT',
    'Order Subsidies including VAT',
    'Non-Order Fees including VAT',
    'Non-Order Subsidies including VAT',
    'Others including VAT',
    'Total',
  ],
]

for (let day = 1; day <= 28; day++) {
  for (let p = 0; p < products.length; p++) {
    if ((day + p * 2) % 4 === 0) continue
    const [sku, price] = products[p]
    const amazonPrice = price * (p === 3 ? 1.08 : 1)
    const amazonFeeRate = p === 4 ? 0.27 : 0.12 + p * 0.012
    const amazonFee = -(amazonPrice * amazonFeeRate)
    const amazonOther = 19
    amazon.push([
      amazonDate(day),
      'DEMO-SETTLEMENT',
      'Order',
      `DEMO-A-${day}-${p}`,
      sku,
      `Demo ${sku}`,
      1,
      'Amazon.eg',
      'Seller',
      '',
      '',
      '',
      money(amazonPrice),
      '0',
      '0',
      money(amazonFee),
      '0',
      '0',
      money(amazonOther),
      money(amazonPrice + amazonFee + amazonOther),
      'Released',
      amazonDate(day),
    ])
    if ((day + p) % 3 !== 0) {
      const noonPrice = price * (p === 2 ? 0.94 : 1)
      const noonFeeRate = p === 1 ? 0.23 : 0.105 + p * 0.009
      const noonFee = -(noonPrice * noonFeeRate)
      const logistics = p === 5 ? -34 : -18
      noon.push([
        'DEMO',
        'Demo contract',
        'DEMO-REF',
        `DEMO-N-${day}-${p}`,
        `DEMO-ITEM-${day}-${p}`,
        iso(day),
        iso(day),
        `Demo ${sku}`,
        sku,
        sku,
        'order',
        'EGP',
        money(noonPrice),
        money(noonFee),
        money(logistics),
        '0',
        '0',
        '0',
        '0',
        '0',
        '0',
        money(noonPrice + noonFee + logistics),
      ])
    }
  }
}

// Reversals and standalone fees make settlement behavior visible in the demo.
amazon.push([
  amazonDate(20),
  'DEMO-SETTLEMENT',
  'Refund',
  'DEMO-A-RETURN',
  'LAMP-01',
  'Demo LAMP-01',
  -1,
  'Amazon.eg',
  'Seller',
  '',
  '',
  '',
  '-690.00',
  '0',
  '0',
  '82.80',
  '0',
  '0',
  '0',
  '-607.20',
  'Released',
  amazonDate(20),
])
amazon.push([
  amazonDate(27),
  'DEMO-SETTLEMENT',
  'Service Fee',
  '',
  '',
  'Demo service fee',
  '',
  'Amazon.eg',
  '',
  '',
  '',
  '',
  '0',
  '0',
  '0',
  '0',
  '0',
  '-65.00',
  '0',
  '-65.00',
  'Released',
  amazonDate(27),
])
amazon.push([
  amazonDate(28),
  'DEMO-SETTLEMENT',
  'Transfer',
  '',
  '',
  'Demo payout',
  '',
  'Amazon.eg',
  '',
  '',
  '',
  '',
  '0',
  '0',
  '0',
  '0',
  '0',
  '0',
  '-5000.00',
  '-5000.00',
  'Released',
  amazonDate(28),
])
noon.push([
  'DEMO',
  'Demo contract',
  'DEMO-REF',
  'DEMO-N-UPDATE',
  'DEMO-ITEM-UPDATE',
  iso(22),
  iso(22),
  'Demo MUG-02',
  'MUG-02',
  'MUG-02',
  'order_update',
  'EGP',
  '-340.00',
  '78.20',
  '0',
  '0',
  '0',
  '0',
  '0',
  '0',
  '0',
  '-261.80',
])
noon.push([
  'DEMO',
  'Demo contract',
  'DEMO-REF',
  '',
  '',
  iso(28),
  iso(28),
  'Demo payout',
  '',
  '',
  'payment',
  'EGP',
  '0',
  '0',
  '0',
  '0',
  '0',
  '0',
  '0',
  '0',
  '-2500.00',
  '-2500.00',
])

await mkdir('public/demo', { recursive: true })
await writeFile('public/demo/amazon.csv', csv(amazon))
await writeFile('public/demo/noon.csv', csv(noon))
