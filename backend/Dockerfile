# Multi-stage build for DMS Backend
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install --prod=false

COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db/schema.sql ./dist/db/schema.sql

RUN mkdir -p uploads
VOLUME ["/app/uploads"]

EXPOSE 4000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/server.js"]