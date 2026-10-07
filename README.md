# Portfolio Trading API

A NestJS backend for listing stocks, executing buy orders against an external brokerage API, and tracking each user's positions. Calls to the upstream provider go through retries, exponential backoff and a circuit breaker. Stock listings are cached in Redis, every order attempt is recorded for auditing, and a daily report goes out by email.

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

## Features

- **Stock catalog**: paginated listing from the upstream provider, cached in Redis (3 min TTL)
- **Order execution**: buy orders forwarded to the brokerage API, validated with `class-validator`
- **Portfolio tracking**: per-user positions with weighted average cost
- **Audit trail**: every order attempt is stored with its status (`SUCCESS` / `FAILED`) and the raw vendor response
- **Resilience**: [Cockatiel](https://github.com/connor4312/cockatiel) policies (retry + exponential backoff + consecutive-failure circuit breaker), configurable through env vars
- **Daily reporting**: a scheduled job emails the previous day's transaction summary
- **API docs**: OpenAPI / Swagger UI at `/api`

## Architecture

```
            ┌──────────────────────────────────────────────┐
 HTTP ───►  │ Controllers   stocks · portfolios · health   │
            ├──────────────────────────────────────────────┤
            │ Services      business rules, cache, P&L     │
            ├──────────────────────────────────────────────┤
            │ Repositories  Prisma (DB) · VendorClient     │
            └──────┬──────────────┬──────────────┬─────────┘
                   │              │              │
             PostgreSQL         Redis     Brokerage API
                                          (retry + circuit breaker)

 Scheduler (cron, 00:00 UTC) ──► ReportService ──► SMTP
```

Design decisions and trade-offs are documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Getting started

### With Docker (recommended)

```bash
cp .env.example .env   # then fill in MARKET_API_* and EMAIL_*
docker compose up -d
```

This starts PostgreSQL, Redis and the API on `http://localhost:3000`. Migrations run automatically on startup.

### Local

Requires Node.js 20+, PostgreSQL 16 and Redis 7.

```bash
yarn install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed       # optional: sample data
yarn start:dev
```

## Configuration

All configuration is read from environment variables (see [`.env.example`](.env.example)).

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `MARKET_API_URL` / `MARKET_API_KEY` | Upstream brokerage API base URL and key | — |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_TTL` | Redis connection and cache TTL (s) | `localhost` / `6379` / `180` |
| `VENDOR_RETRY_ATTEMPTS` | Max retries per vendor call | `3` |
| `VENDOR_RETRY_INITIAL_DELAY` / `VENDOR_RETRY_MAX_DELAY` | Backoff bounds (ms) | `100` / `5000` |
| `VENDOR_CIRCUIT_BREAKER_THRESHOLD` | Consecutive failures before opening the circuit | `5` |
| `VENDOR_CIRCUIT_BREAKER_DURATION` | Time the circuit stays open (ms) | `30000` |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASSWORD` / `EMAIL_FROM` | SMTP settings | — |
| `DAILY_REPORT_RECIPIENTS` | Comma-separated report recipients | — |

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `GET` | `/stocks?nextToken=` | List available stocks (paginated, cached) |
| `POST` | `/stocks/:symbol/buy` | Place a buy order |
| `GET` | `/portfolios?email=` | Get a user's positions |

Example order:

```bash
curl -X POST http://localhost:3000/stocks/AAPL/buy \
  -H "Content-Type: application/json" \
  -d '{"email": "jane@example.com", "price": 150.25, "quantity": 10}'
```

Interactive docs: `http://localhost:3000/api`

## Project structure

```
src/
├── stocks/          # catalog + order execution (controller, service, repository, DTOs)
├── portfolios/      # positions and weighted average cost
├── transactions/    # order audit trail
├── users/           # user lookup
├── email/           # SMTP delivery, report builder, cron scheduler
├── shared/          # vendor client, resilience policies, cache module, constants
└── prisma/          # Prisma service
prisma/              # schema, migrations, seed
docs/                # architecture notes
```

## Testing

```bash
yarn test        # unit tests
yarn test:e2e    # end-to-end
yarn test:cov    # coverage
```

## Roadmap

- JWT authentication and per-user rate limiting
- Sell orders and multi-currency support
- Wrap the order record and position update in a single DB transaction
- Prometheus metrics and tracing
