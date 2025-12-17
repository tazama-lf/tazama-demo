FROM node:22-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./
COPY yarn*.lock ./
EXPOSE 3001

FROM base AS builder
WORKDIR /app

# Accept GitHub token as build argument
ARG GH_TOKEN

# Create .npmrc with authentication for GitHub Packages
RUN echo "//npm.pkg.github.com/:_authToken=${GH_TOKEN}" > ~/.npmrc && \
    echo "@tazama-lf:registry=https://npm.pkg.github.com" >> ~/.npmrc

COPY . .

# Install dependencies with authentication
RUN yarn install

# Clean up the auth token for security
RUN rm -f ~/.npmrc

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
ENV NEXT_PUBLIC_PG_HOST="localhost"
ENV NEXT_PUBLIC_PG_PORT="5432"
ENV NEXT_PUBLIC_PG_USER="your_pg_user"
ENV NEXT_PUBLIC_PG_PASSWORD="your_pg_password"
ENV NEXT_PUBLIC_PG_DATABASE="your_pg_database"
ENV NEXT_PUBLIC_WS_URL="http://localhost:3001"
ENV NEXT_PUBLIC_NATS_SUBSCRIPTIONS="['connection', '>', 'typology-999@1.0.0']"
ENV NEXT_PUBLIC_ADMIN_SERVICE_HOSTING="http://localhost:5100"
ENV NEXT_PUBLIC_CONDITION_TYPES="['non-overridable-block', 'overridable-block', 'override']"
ENV NEXT_PUBLIC_EVENT_TYPES="['pacs.008.001.10', 'pacs.002.001.12', 'pain.001.001.11', 'pain.013.001.09']"
ENV NEXT_PUBLIC_CONDITION_REASONS="['Suspicion of Money Laundering', 'Violation of KYC/AML Requirements', 'Suspicion of Terrorist Financing', 'Tax Evasion Concerns', 'Regulatory Reporting Thresholds', 'Unusual Transaction Patterns', 'High-Risk Countries', 'Multiple Failed Login Attempts', 'Fraudulent Activity', 'Phishing or Account Takeover', 'Suspicious Beneficiaries', 'System Errors', 'Exceeding Limits', 'Legal Holds or Court Orders', 'Adverse media reports', 'Dormant or Inactive Accounts', 'Internal Bank Policies']"

# Copy built artifacts from builder stage
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/public ./public

CMD ["yarn", "start"]

FROM base AS dev
WORKDIR /app

ENV NODE_ENV=development
ENV PORT="3001"
ENV NEXT_PUBLIC_URL="http://localhost:3001"
ENV NEXT_PUBLIC_TMS_SERVER_URL="http://localhost:5000"
ENV NEXT_PUBLIC_TMS_KEY="no_key_set"
ENV NEXT_PUBLIC_CMS_NATS_HOSTING="nats://nats:4222"
ENV NEXT_PUBLIC_NATS_USERNAME=""
ENV NEXT_PUBLIC_NATS_PASSWORD=""
ENV NEXT_PUBLIC_PG_HOST="localhost"
ENV NEXT_PUBLIC_PG_PORT="5432"
ENV NEXT_PUBLIC_PG_USER="your_pg_user"
ENV NEXT_PUBLIC_PG_PASSWORD="your_pg_password"
ENV NEXT_PUBLIC_PG_DATABASE="your_pg_database"
ENV NEXT_PUBLIC_WS_URL="http://localhost:3001"
ENV NEXT_PUBLIC_NATS_SUBSCRIPTIONS="['connection', '>', 'typology-999@1.0.0']"

# Accept GitHub token as build argument
ARG GH_TOKEN

# Create .npmrc with authentication for GitHub Packages
RUN echo "//npm.pkg.github.com/:_authToken=${GH_TOKEN}" > ~/.npmrc && \
    echo "@tazama-lf:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Install dependencies
RUN yarn install

# Clean up the auth token for security
RUN rm -f ~/.npmrc

# Copy source code
COPY . .

CMD ["yarn", "dev"]
