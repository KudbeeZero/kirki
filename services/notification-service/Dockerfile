# ── Build stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.base.json ./
COPY packages ./packages
COPY services/notification-service ./services/notification-service
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @simcoin/notification-service build

# ── Runtime stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && addgroup -S app && adduser -S app -G app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/notification-service/dist ./dist
COPY --from=build /app/services/notification-service/package.json ./
USER app
EXPOSE 4009
CMD ["node", "dist/main.js"]
