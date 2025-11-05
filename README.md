# Fuse Test - Service

A **NestJS-app** stock trading service that integrates with the **Fuse Finance API** to manage stock portfolios and transactions.

## Overview

This service provides a reliable backend for trading operations, featuring API resilience, caching, and automated daily reporting.

## Features

- **Stock Management:** List and purchase stocks  
- **Portfolio Tracking:** View user portfolios with real-time valuations  
- **Transaction History:** Full audit trail of purchases  
- **Resilience:** Includes retry and circuit breaker logic for external APIs  
- **Caching:** Redis integration for better performance  
- **Daily Reports:** Automated email reports summarizing daily transactions  
- **API Documentation:** Swagger/OpenAPI available at `/api`

## Tech Stack

- **Framework:** NestJS 11  
- **Database:** PostgreSQL 16 with Prisma ORM  
- **Cache:** Redis 7  
- **Email:** Nodemailer (SMTP)  
- **Resilience:** Cockatiel (retry, circuit breaker, backoff)  
- **Documentation:** Swagger/OpenAPI  

## Requirements

- Node.js 20+  
- Docker and Docker Compose (recommended)  
- PostgreSQL 16 and Redis 7 (if running locally)  

## Environment Setup

Create a `.env` file in the project root with:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fuse_db

# Fuse API
FUSE_API_URL=https://api.challenge.fusefinance.com
FUSE_API_KEY=nSbPbFJfe95BFZufiDwF32UhqZLEVQ5K4wdtJI2e

# Vendor Resilience Configuration
VENDOR_RETRY_ATTEMPTS=3
VENDOR_RETRY_INITIAL_DELAY=100
VENDOR_RETRY_MAX_DELAY=5000
VENDOR_CIRCUIT_BREAKER_THRESHOLD=5
VENDOR_CIRCUIT_BREAKER_DURATION=30000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=180

# Email Configuration (SMTP)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=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
EMAIL_FROM=contacto@andreslargo.com

# Daily Report Configuration
DAILY_REPORT_RECIPIENTS=andresf.largo@gmail.com

# Prisma Database Connection
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
```

Installation
Using Docker (Recommended)
bash
Always show details

Copy code
docker-compose up -d
This will start:

PostgreSQL on port 5432

Redis on port 6379

The app on port 3000

Database migrations run automatically on startup.

Local Development
bash
Always show details

Copy code
yarn install
npx prisma migrate deploy
yarn start:dev
Running the App
Development: yarn start:dev

Production: yarn build && yarn start:prod

Debug: yarn start:debug

API Endpoints
GET /stocks → List available stocks

POST /stocks/:symbol/buy → Buy stock

GET /portfolios?email=user@example.com → Get portfolio

Access Swagger docs at:
http://localhost:3000/api

Daily Reports
A scheduled task runs daily at midnight (UTC) and sends transaction summaries to recipients defined in DAILY_REPORT_RECIPIENTS.

Project Structure
bash
Always show details

Copy code
src/
 ├── stocks/          # Stock operations
 ├── portfolios/      # Portfolio management
 ├── transactions/    # Internal transaction logic
 ├── email/           # Email reporting
 ├── shared/          # Cache, resilience, vendor client
 └── prisma/          # ORM and migrations
Testing
bash
Always show details

Copy code
yarn test       # Unit tests
yarn test:e2e   # E2E tests
yarn test:cov   # Coverage
