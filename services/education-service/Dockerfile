# ── Build stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.base.json ./
COPY packages ./packages
COPY services/education-service ./services/education-service
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @simcoin/education-service build

# ── Runtime stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && addgroup -S app && adduser -S app -G app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/education-service/dist ./dist
COPY --from=build /app/services/education-service/package.json ./
USER app
EXPOSE 4008
CMD ["node", "dist/main.js"]
