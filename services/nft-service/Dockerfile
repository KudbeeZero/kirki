# ── Build stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.base.json ./
COPY packages ./packages
COPY services/nft-service ./services/nft-service
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @simcoin/nft-service build

# ── Runtime stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && addgroup -S app && adduser -S app -G app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/nft-service/dist ./dist
COPY --from=build /app/services/nft-service/package.json ./
USER app
EXPOSE 4007
CMD ["node", "dist/main.js"]
