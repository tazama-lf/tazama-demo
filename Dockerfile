FROM node:22-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./
COPY yarn*.lock ./
EXPOSE 3001

FROM base AS builder
WORKDIR /app
COPY . .
# RUN yarn build

FROM base AS production
WORKDIR /app

ENV NODE_ENV=prod
ENV PORT="3001"
ENV NEXT_PUBLIC_URL="http://localhost:3001"
ENV NEXT_PUBLIC_TMS_SERVER_URL="http://localhost:5001"
ENV NEXT_PUBLIC_TMS_KEY="no_key_set"
ENV NEXT_PUBLIC_CMS_NATS_HOSTING="nats://nats:4222"
ENV NEXT_PUBLIC_NATS_USERNAME=""
ENV NEXT_PUBLIC_NATS_PASSWORD=""
ENV NEXT_PUBLIC_ARANGO_DB_HOSTING="http://localhost:18529"
ENV NEXT_PUBLIC_DB_USER="root"
ENV NEXT_PUBLIC_DB_PASSWORD=""
ENV NEXT_PUBLIC_WS_URL="http://localhost:3001"
ENV NEXT_PUBLIC_NATS_SUBSCRIPTIONS="['connection', '>', 'typology-999@1.0.0']"
RUN npm ci

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/public ./public

CMD npm start

FROM base AS dev
ENV NODE_ENV=dev
ENV PORT="3001"
ENV NEXT_PUBLIC_URL="http://localhost:3001"
ENV NEXT_PUBLIC_TMS_SERVER_URL="http://localhost:5000"
ENV NEXT_PUBLIC_TMS_KEY="no_key_set"
ENV NEXT_PUBLIC_CMS_NATS_HOSTING="nats://nats:4222"
ENV NEXT_PUBLIC_NATS_USERNAME=""
ENV NEXT_PUBLIC_NATS_PASSWORD=""
ENV NEXT_PUBLIC_ARANGO_DB_HOSTING="http://localhost:18529"
ENV NEXT_PUBLIC_DB_USER="root"
ENV NEXT_PUBLIC_DB_PASSWORD=""
ENV NEXT_PUBLIC_WS_URL="http://localhost:3001"
ENV NEXT_PUBLIC_NATS_SUBSCRIPTIONS="['connection', '>', 'typology-999@1.0.0']"
# RUN yarn install --frozen-lockfile 

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/public ./public

COPY . .
CMD yarn start