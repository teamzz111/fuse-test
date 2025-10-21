# Fuse Test — Architecture & Design

## Overview
Here's how I built the **Fuse Test** and why things are the way they are.

## Architecture

Went with a standard **layered approach**:

```
API (Controllers)
↓
Business Logic (Services)
↓
Data Access (Repositories)
↓
Database (PostgreSQL)
```

**External stuff:**  
Fuse Finance API via VendorClient, Redis for caching, SMTP for daily reports.

### Modules
Split into NestJS modules:
- **StocksModule:** Listing and buying stocks  
- **PortfoliosModule:** User portfolios and valuations  
- **TransactionsModule:** Full transaction history  
- **EmailModule:** Email reports  
- **Shared / Cache / Prisma:** Common utilities, cache config, DB stuff

## Key Decisions

### Repository Pattern
Repositories handle DB access. Keeps Prisma queries out of business logic, easier to test, can mock stuff in unit tests.  
Each entity gets its own repo (User, Portfolio, Transaction, Stock).

### API Resilience
The Fuse Finance API is flaky. Added retries, exponential backoff, circuit breaker with **Cockatiel**.  
All tunable via env vars.

### Caching
Stock lists cached in Redis for ~**3 minutes**. Cuts vendor API calls, speeds things up.

### Transactions
Every purchase attempt gets logged with status (`SUCCESS`/`FAILED`) and vendor response. Complete audit trail, helps debugging.

### Portfolio Calculation
Real-time calculation pulling latest prices. Simple, accurate enough. Cache prevents redundant calls.

### Email Reports
Scheduled job at midnight UTC. Generates transaction summary, sends emails.  
Failures get logged but don't crash anything.

### Data Model
DB separates users, portfolios, transactions properly.  
Portfolios track **weighted average price** for P&L.

### API Design
Standard REST:
- `GET /stocks`
- `POST /stocks/:symbol/buy`
- `GET /portfolios?email=...`

### Configuration
Everything through env vars (DB, cache, email, resilience) via ConfigService. No hardcoded config.

### Validation & Docs
**class-validator** for inputs, **Swagger/OpenAPI** for API docs and testing.

## Tech Stack
- **NestJS 11** — Modular, good TypeScript support  
- **PostgreSQL + Prisma** — Solid relational DB, type safety  
- **Redis** — Caching with TTL  
- **Nodemailer** — SMTP email delivery  

## Performance & Security
- Cache cuts repeated stock calls ~95%  
- Indexed tables for fast queries  
- Parameterized queries (no SQL injection)  
- API keys in env vars only  
- Input validation and sanitization  

## Scalability
Stateless service, scales horizontally.  
Can add PostgreSQL read replicas and Redis clustering if needed.

## Future Work
Potential additions:
- JWT auth  
- Rate limiting  
- WebSocket portfolio updates  
- Better reporting/analytics  
- Selling stocks, multi-currency  
- APM and Prometheus monitoring

## Testing & Deployment
Unit tests, E2E tests, coverage reports.  
Runs in Docker with automatic migrations. Environment-specific configs for dev/staging/prod.

## Summary
Built to be simple but reliable:
- Modular, extensible  
- Handles flaky external APIs  
- Fast with caching  
- Ready to scale

Questions? Open an issue.