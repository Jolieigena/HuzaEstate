# syntax=docker/dockerfile:1

# ---- deps: install dependencies only (cached separately from source changes) ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the Next.js app ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, not read at
# container start — they must be supplied here as build args (see docker-compose.yml),
# not just as runtime environment variables on the runner stage below.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PROPERTY_API_URL
ARG NEXT_PUBLIC_PAYMENT_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_PROPERTY_API_URL=${NEXT_PUBLIC_PROPERTY_API_URL} \
    NEXT_PUBLIC_PAYMENT_API_URL=${NEXT_PUBLIC_PAYMENT_API_URL} \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- runner: minimal production image ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8085 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# .next/standalone already contains a pruned node_modules and server.js; static assets and
# public/ are excluded from it by design and must be copied in alongside.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8085

CMD ["node", "server.js"]
