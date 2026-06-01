# syntax=docker/dockerfile:1
# SPDX-License-Identifier: Apache-2.0
FROM node:22-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./
EXPOSE 3001

FROM base AS builder
WORKDIR /app

COPY .npmrc ./
COPY . .

# Install dependencies with authentication
RUN --mount=type=secret,id=GH_TOKEN,env=GH_TOKEN npm ci

# Build the Next.js application
RUN npm run build

FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT="3001"
ENV NEXT_PUBLIC_URL="http://localhost:3001"
ENV NEXT_PUBLIC_WS_URL="http://localhost:3001"

# Server-side configuration (never exposed to browser)
ENV NATS_SERVER_URL=""
ENV ADMIN_SERVICE_URL=""
ENV TMS_SERVER_URL=""
ENV AUTHENTICATED="false"
ENV AUTH_SERVICE_URL=""
# NEXTAUTH_SECRET is required in authenticated deployments - generate with: openssl rand -base64 32
ENV NEXTAUTH_SECRET=""

# Copy built artifacts from builder stage
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/next.config.mjs ./next.config.mjs

CMD ["node", "server.js"]
