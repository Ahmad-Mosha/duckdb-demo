# Commerce Lab

A local commerce data workspace for Amazon and Noon settlement exports. It uses DuckDB-Wasm in the browser to turn source-specific CSV rows into a small analytical model. There is no application server, account, or database to operate.

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL. The app starts with fully synthetic Amazon and Noon reports so the analysis can be explored immediately. Use **Import Amazon** and **Import Noon** to replace the demo with your own CSV exports. The first private import clears the synthetic sources; subsequent imports add or replace a private source. **Restore synthetic demo** clears the private session.

## What it analyzes

- A settlement bridge: source-defined sales, signed fees, other adjustments, and commerce settlement. Payout transfers are shown separately.
- Marketplace comparison with each report's actual date coverage and source-defined sales semantics visible.
- SKU ledger with sorting, filtering, fee-to-sales ratio, settlement, and cumulative sales concentration using a DuckDB window query.
- Daily reported sales by marketplace, keeping missing source dates distinct from zero sales.
- Transaction-type breakdown and row-level reconciliation, missing date, and missing SKU checks.
- A compact read-only SQL console with a 200-row preview, execution time, and the schema of normalized and raw tables.

## Data model

`amazon_raw` and `noon_raw` retain the CSV columns as text. `commerce_events` is a DuckDB view over source-specific projections:

| Canonical column    | Amazon                                         | Noon                                                            |
| ------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| `event_date`        | Posted `date/time`                             | `Order Date`                                                    |
| `sku`               | `sku`                                          | `Partner SKUs`                                                  |
| `sales_amount`      | `product sales`                                | `Net Proceeds`                                                  |
| `fee_amount`        | Selling, FBA, other transaction fees           | Referral, fulfillment/logistics, other order and non-order fees |
| `other_amount`      | Shipping credits, promotional rebates, `other` | Shipping credits, subsidies, `Others`                           |
| `settlement_amount` | `total`                                        | `Total`                                                         |

All money fields retain the report's sign. `sales_amount + fee_amount + other_amount` is checked against each row's reported total. Amazon `Transfer` and Noon `payment` rows are marked as payouts and excluded from commerce settlement and product analysis. Amazon `Refund` and Noon `order_update` rows remain signed events; they are not silently deduplicated or reclassified.

**Settlement is not profit.** Neither supplied report contains product cost. Amazon product sales and Noon net proceeds also have different source definitions, so the comparison is directional rather than an accounting-equivalent revenue comparison. Exact SKU strings are used as supplied; the app does not infer product matches. It assumes the imported reports use the same currency when showing combined money totals.

The browser strips Amazon's eight-line preamble, parses the two known CSV layouts into Arrow string columns, and inserts them into DuckDB-Wasm. DuckDB creates the normalized SQL view and performs the grouped, time-series, reconciliation, schema, and window queries. The UI receives query results. See [`src/lib/duckdb.ts`](src/lib/duckdb.ts) and [`src/lib/analytics.ts`](src/lib/analytics.ts).

## Privacy and scope

The real reports in `files/` are ignored by Git and are never required for a public build. `public/demo/` is generated from [`scripts/generate-demo.mjs`](scripts/generate-demo.mjs); it contains synthetic SKUs, identifiers, and amounts only. Report files are read in the browser and held in DuckDB-Wasm memory for the tab session. The SQL console can access raw private columns locally, including order identifiers, so do not publish screenshots of a private session. No upload endpoint or telemetry is included; font files are bundled locally.

This MVP supports the two inspected CSV layouts, one export per source at a time. It does not persist data after refresh, reconcile different currencies, infer costs or profit, or normalize arbitrary marketplace formats.

## Checks

```bash
npm run lint
npm run build
```

The synthetic reports include a refund, an order update, standalone fee, and payouts to exercise the settlement rules. In browser validation, the demo and both supplied report layouts loaded, reconciliation returned zero unmatched rows, SQL queries executed with timing, and invalid SQL displayed an error.
