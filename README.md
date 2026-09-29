# Commerce Lab

Commerce Lab is a local analytical workspace built around **DuckDB-Wasm**. It turns Amazon and Noon settlement exports into SQL tables, combines their different schemas in a typed view, and queries that view for marketplace comparisons, product concentration, fee pressure and reconciliation. Everything runs inside the browser.

The experiment is to make a small embedded analytical database the core of a commerce exploration tool: import reports, inspect their model, and ask further questions using the same database that powers the charts.

## Where DuckDB does the work

| Stage     | Implemented DuckDB usage                                                                                                                                                                       | Source                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Load      | Arrow tables are inserted into an in-memory database. Source replacement and view creation run inside `BEGIN` / `COMMIT`, with `ROLLBACK` on failure.                                          | [database.ts](src/lib/commerce/database.ts) |
| Normalize | SQL projections use `TRY_CAST`, `TRY_STRPTIME`, `NULLIF` and source-specific fee expressions. `UNION ALL` combines both projections in the `commerce_events` view.                             | [adapters.ts](src/lib/commerce/adapters.ts) |
| Aggregate | `GROUP BY` calculates marketplace totals, daily activity, SKU-level fees and source-native transaction totals. Conditional sums separate payout transfers and flag reconciliation differences. | [queries.ts](src/lib/commerce/queries.ts)   |
| Rank      | A CTE aggregates positive net sales by SKU; `ROW_NUMBER()` and cumulative `SUM(...) OVER (...)` produce the concentration ranking.                                                             | [queries.ts](src/lib/commerce/queries.ts)   |
| Explore   | The SQL editor queries the same raw tables and normalized view. `information_schema.columns` supplies the catalog's column names and types.                                                    | [session.ts](src/lib/commerce/session.ts)   |

A single [DuckDB runtime](src/lib/duckdb/runtime.ts) owns the browser worker and connection. Raw reports remain in its in-memory tables; predefined queries return aggregated result sets for rendering. JavaScript handles CSV parsing and Arrow construction before import, then combines aggregate totals, arranges chart series and formats results. It does not calculate the per-SKU rankings or scan raw report rows for the analytical views.

### One query across two marketplaces

This is the SQL workspace's default query. Both sources are queried through the normalized view, with payout transfers excluded from commerce activity:

```sql
SELECT
  marketplace,
  COUNT(*) AS events,
  ROUND(SUM(sales_amount), 2) AS reported_sales,
  ROUND(SUM(fee_amount), 2) AS fees,
  ROUND(SUM(settlement_amount), 2) AS settlement
FROM commerce_events
WHERE NOT is_payout
GROUP BY marketplace
ORDER BY reported_sales DESC;
```

The built-in synthetic reports produce:

| Marketplace | Events | Reported sales |       Fees | Settlement |
| ----------- | -----: | -------------: | ---------: | ---------: |
| Amazon      |    128 |      82,075.20 | -12,699.59 |  71,769.61 |
| Noon        |     85 |      52,640.40 |  -8,887.36 |  43,753.04 |

These are synthetic values, not merchant data. The remaining two demo rows are payout transfers.

### Concentration with a window function

The Products view uses this query for the all-marketplace scope. It first groups identical SKU text across sources, then computes rank and running share inside DuckDB:

```sql
WITH sku_sales AS (
  SELECT sku, SUM(sales_amount) AS sales
  FROM commerce_events
  WHERE sku IS NOT NULL AND NOT is_payout
  GROUP BY sku
  HAVING SUM(sales_amount) > 0
), ranked AS (
  SELECT sku, ROUND(sales, 2) AS sales,
    ROW_NUMBER() OVER (ORDER BY sales DESC)::INTEGER AS rank,
    ROUND(
      100 * SUM(sales) OVER (
        ORDER BY sales DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) / SUM(sales) OVER (), 1
    ) AS cumulative_pct
  FROM sku_sales
)
SELECT * FROM ranked ORDER BY rank;
```

This result drives the cumulative bars and the top-three concentration signal. Changing the marketplace scope adds a source predicate before aggregation; it does not filter an already-computed ranking in React.

### Why this architecture fits

The same relational model supports the predefined views and ad hoc exploration. Transformations and analytical definitions can be read directly in SQL, and a new question can be investigated in the editor without exporting to another tool. DuckDB-Wasm keeps that database local while Next.js serves a static frontend.

The current importer uses Papa Parse and Arrow, not DuckDB's CSV reader. There is no Parquet import, persistent database, remote query service or performance benchmark in this MVP. Displayed timings measure browser-side query round trips and result conversion; they are not engine profiling measurements.

## Stack

Next.js App Router · TypeScript · Tailwind CSS · shadcn/ui (Radix) · DuckDB-Wasm

The interface uses customized shadcn primitives, TanStack Table for sorting, Recharts for analytical plots, and CodeMirror for SQL. IBM Plex Sans and Mono are bundled locally. Next.js produces a static export; there are no API routes or application services to deploy.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open the URL printed by Next.js. The workspace loads synthetic Amazon and Noon reports on startup. Use **Import report → Amazon / Noon** to open a matching export from the local device. The first import replaces the synthetic session; later imports add or replace a marketplace. The **Restore synthetic demo** control clears the imported session.

## Analysis workspace

| View          | Implemented analysis                                                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview      | Reported sales, signed marketplace fees, adjustments, commerce settlement, source breakdowns, a settlement waterfall, a marketplace comparison chart and table, report date coverage, and deterministic concentration, fee, and reconciliation signals. |
| Products      | Sortable and filterable SKU ledger, fee-to-sales ratio, sales versus fee-rate scatterplot, and cumulative sales concentration calculated with a DuckDB window function.                                                                                 |
| Activity      | Daily sales by marketplace, source-native transaction type totals, and checks for missing dates, missing SKUs, and rows whose components do not match the reported total.                                                                               |
| SQL workspace | Read-only `SELECT`/`WITH` queries against the normalized view and raw tables, a 200-row result preview, execution time, and a table/column catalog.                                                                                                     |

Source and date coverage remain visible because the two exports can represent different periods and use different sales definitions.

## Import and normalization

```text
Amazon / Noon CSV → browser CSV parser → Arrow table → DuckDB-Wasm raw table
                                                     ↓
                                      commerce_events SQL view
                                                     ↓
                                 aggregate and window SQL queries → UI
```

The importer handles the inspected 22-column CSV layouts. It removes the eight-line preamble from Amazon exports, parses each file into Arrow string columns, and inserts the result into `amazon_raw` or `noon_raw`. Source-specific DuckDB projections create the `commerce_events` view. The view retains signed amounts and source-native transaction labels. Invalid date/quantity casts become null; missing or unparseable monetary cells currently become zero, so reconciliation checks should be reviewed when importing a report. Imports replace source tables and the normalized view in one transaction. Invalid imports leave the existing session intact. See [the adapters](src/lib/commerce/adapters.ts) and [the analytical queries](src/lib/commerce/queries.ts).

| `commerce_events` field | Amazon source                                      | Noon source                                                      |
| ----------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| `event_date`            | Posted `date/time`                                 | `Order Date`                                                     |
| `sku`                   | `sku`                                              | `Partner SKUs`                                                   |
| `sales_amount`          | `product sales`                                    | `Net Proceeds`                                                   |
| `fee_amount`            | Selling, FBA, and other transaction fees           | Referral, fulfillment/logistics, other order, and non-order fees |
| `other_amount`          | Shipping credits, promotional rebates, and `other` | Shipping credits, subsidies, and `Others`                        |
| `settlement_amount`     | `total`                                            | `Total`                                                          |

Amazon `Transfer` and Noon `payment` rows are classified as payout transfers. They are excluded from commerce settlement, SKU analysis, and the daily sales series. Refunds and order updates remain signed events. Reconciliation compares `sales_amount + fee_amount + other_amount` with each row's reported total, allowing a 0.02 rounding tolerance.

**Commerce settlement is not profit.** The reports do not contain product cost. Amazon product sales and Noon net proceeds are also different source-defined measures; cross-marketplace sales comparisons are directional. Combined amounts assume the imported files use the same currency. SKUs are matched only by their exact text.

## Code structure

```text
src/app/                    App Router entry points and design tokens
src/components/ui/          Customized shadcn primitives
src/components/workspace/   Analytical views, charts, tables, SQL editor
src/hooks/                  Workspace loading, filtering and import state
src/lib/duckdb/              Browser worker, connection and query runtime
src/lib/commerce/
  adapters.ts               Source parsing and normalization projections
  database.ts               Atomic report replacement
  queries.ts                Analytical SQL and read-query preview wrapper
  analytics.ts              Query orchestration and derived metrics
  session.ts                Demo/import/query operations
  types.ts                  Shared data contracts
src/lib/format.ts           Display formatting
```

React views receive query results and derived analytical data. SQL, source normalization and financial calculations live in the data layer. The DuckDB connection initializes only in the browser, behind a client-only workspace boundary.

## Privacy and demo data

CSV processing and DuckDB execution occur in the browser. Imported files remain in memory for the tab session and are not uploaded. The SQL console can inspect raw imported columns locally, including private identifiers. DuckDB workers and WebAssembly binaries are copied from the installed package into local static assets during install/build. No application telemetry is configured and fonts are bundled with the application.

`public/demo/` contains synthetic reports produced by [the demo generator](scripts/generate-demo.mjs). The private `files/` directory and local workbook/database formats are excluded by `.gitignore`; real reports are not part of the repository or build.

## Validation

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
```

To serve the production static export:

```bash
npm run build
npm run preview
```

Deploy the generated `out/` directory to a static host with WebAssembly support. `public/duckdb/` is generated locally and is not committed.

The focused tests verify supported report shapes, signed settlement metrics, payout exclusion, missing dates and query restrictions. The synthetic reports include refunds, order updates, standalone fees, and payout transfers. They provide known cases for inspecting the settlement rules, charts, data checks, and SQL console.

## Current limits

- Supports the two inspected report layouts, with one active export per marketplace.
- Keeps data only for the current browser tab; there is no saved workspace.
- Does not convert currencies, infer product cost or profit, or map different SKU names to the same product.
- SQL results are limited to a 200-row preview, and the editor accepts one read-only query at a time.
