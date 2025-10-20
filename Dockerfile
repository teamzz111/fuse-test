# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile


COPY . .

RUN npx prisma generate

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
