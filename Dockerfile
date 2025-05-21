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
ENV NEXT_PUBLIC_CMS_NATS_HOSTING="nats://localhost:14222"
ENV NEXT_PUBLIC_NATS_USERNAME=""
ENV NEXT_PUBLIC_NATS_PASSWORD=""
ENV NEXT_PUBLIC_ARANGO_DB_HOSTING="http://localhost:18529"
ENV NEXT_PUBLIC_DB_USER="root"
ENV NEXT_PUBLIC_DB_PASSWORD=""
ENV NEXT_PUBLIC_WS_URL="http://localhost:3001"
ENV NEXT_PUBLIC_NATS_SUBSCRIPTIONS="['connection', '>', 'typology-999@1.0.0']"
ENV NEXT_PUBLIC_ADMIN_SERVICE_HOSTING="http://localhost:5100"
ENV NEXT_PUBLIC_CONDITION_TYPES="['non-overridable-block', 'overridable-block', 'override']"
ENV NEXT_PUBLIC_EVENT_TYPES="['pacs.008.001.10', 'pacs.002.001.12', 'pain.001.001.11', 'pain.013.001.09']"
ENV NEXT_PUBLIC_CONDITION_REASONS="['Suspicion of Money Laundering', 'Violation of KYC/AML Requirements', 'Suspicion of Terrorist Financing', 'Tax Evasion Concerns', 'Regulatory Reporting Thresholds', 'Unusual Transaction Patterns', 'High-Risk Countries', 'Multiple Failed Login Attempts', 'Fraudulent Activity', 'Phishing or Account Takeover', 'Suspicious Beneficiaries', 'System Errors', 'Exceeding Limits', 'Legal Holds or Court Orders', 'Adverse media reports', 'Dormant or Inactive Accounts', 'Internal Bank Policies']"
RUN npm ci

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/public ./public

CMD ["yarn", "dev"]

FROM base AS dev
ENV NODE_ENV=development
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
CMD ["yarn", "dev"]
