# Architecture & design decisions

## Layers

The service follows a layered architecture split into NestJS modules:

| Layer | Responsibility |
|---|---|
| **Controllers** | HTTP contract, input validation (DTOs + `ValidationPipe` with whitelisting), OpenAPI metadata |
| **Services** | Business rules: caching, order flow, average-cost calculation, reporting |
| **Repositories** | Data access: Prisma for PostgreSQL, `VendorClientService` for the upstream API |

Modules: `StocksModule`, `PortfoliosModule`, `TransactionsModule`, `UsersModule`, `EmailModule`, plus `SharedModule` (vendor client, cache, resilience) and `PrismaModule`.

## Decisions

### Repository pattern
Prisma queries and HTTP calls stay out of the business logic. Services depend on repositories, so unit tests can mock persistence and the vendor separately.

### Resilience around the upstream API
The external brokerage API can be slow or fail intermittently. Every call is wrapped in a Cockatiel policy:

1. **Retry** with exponential backoff (100 ms → 5 s by default), only for `5xx`, `429` and network errors. Client errors (`4xx`) fail fast.
2. **Circuit breaker** that opens after N consecutive failures and stays open for a configurable window, so a degraded provider doesn't pile up latency.

All thresholds are env-configurable, so they can be tuned per environment without code changes.

### Caching
Stock listings are cached in Redis for 3 minutes, keyed by pagination token. Prices barely change within that window, and the cache absorbs most repeated reads. Orders are never cached.

### Order audit trail
Every purchase attempt, successful or not, is persisted in `transactions` with its status and the raw vendor response (`JSONB`). That gives a full audit trail and makes it easier to debug disagreements with the provider.

### Portfolio valuation
Positions store quantity and **weighted average price**, which are updated on each successful order:

```
newAvg = (qty × avg + buyQty × buyPrice) / (qty + buyQty)
```

Quantities use `DECIMAL(20,8)` to support fractional shares. Prices use `DECIMAL(10,2)`.

### Reporting
A `@nestjs/schedule` cron job runs at 00:00 UTC, aggregates the previous day's transactions and emails an HTML summary to each configured recipient. A failure for one recipient is logged and doesn't stop delivery to the others.

### Configuration
Everything (DB, cache, SMTP, vendor, resilience) comes from environment variables through `ConfigService`. Nothing environment-specific is hardcoded.

## Data model

```
users 1 ──── * portfolios      (unique: user_id + symbol)
  │
  └───── * transactions        (status, price, quantity, vendor_response JSONB)
```

## Scalability

The API is stateless (cache and state live in Redis/PostgreSQL), so it scales horizontally behind a load balancer. Natural next steps are PostgreSQL read replicas for portfolio reads and Redis clustering. With multiple replicas, the report cron would need a distributed lock.

## Known trade-offs

- The order record and the position update are separate writes. Wrapping them in a single `prisma.$transaction` is on the roadmap.
- Users are identified by email with no authentication, which is fine for an internal service but not for a public API.
