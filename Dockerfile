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

# Build provenance - surfaced by /api/version (/api/health/version) for
# operators and support. These are intentionally promoted to ENV so they
# remain visible inside the running container; when unset (local builds)
# the /api/version handler falls back to "unknown".
ARG GIT_SHA="unknown"
ARG BUILD_TIME="unknown"
ENV GIT_SHA=${GIT_SHA}
ENV BUILD_TIME=${BUILD_TIME}

ENV NODE_ENV=production
ENV PORT="3001"
ENV NEXT_PUBLIC_URL="http://localhost:3001"
ENV NEXT_PUBLIC_WS_URL="http://localhost:3001"

# Server-side configuration (never exposed to browser).
# Required vars (NATS_SERVER_URL, ADMIN_SERVICE_URL, TMS_SERVER_URL) must be
# provided by the caller - no defaults are baked in so a missing value fails
# fast at env.mjs validation rather than later at request time.
# Optional vars (AUTH_SERVICE_URL, NEXTAUTH_SECRET) are intentionally left
# unset so the caller can omit them; AUTHENTICATED defaults to "false" so the
# image is usable out-of-the-box without an auth backend.
# NEXTAUTH_SECRET is required when AUTHENTICATED=true - generate with: openssl rand -base64 32
ENV AUTHENTICATED="false"

# Copy built artifacts from builder stage
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/env.mjs ./env.mjs
# server.js is plain CommonJS and is not bundled by Next; any module it
# requires at runtime (currently the resilient network-map fetch and the
# retry helper in lib/) must be copied into the runtime image explicitly.
# Without this, the container crashes on startup with
# "Cannot find module './lib/network-map'".
COPY --from=builder /app/lib ./lib

# Container-level liveness probe. Uses the cheap /api/health endpoint - no
# dependency I/O is performed, so a flaky NATS / admin / TMS will not
# trigger restart loops. Orchestrators (k8s, docker swarm) should additionally
# probe /api/ready for traffic-readiness; see deployment.yaml.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:'+ (process.env.PORT||3001) +'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
