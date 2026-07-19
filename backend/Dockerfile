# CareerBridge backend (Express + Prisma). node:22-alpine runtime so both
# `node` and the Prisma CLI exist for the startup migration.

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy the full node_modules from the build stage. This deliberately keeps the
# Prisma CLI (a devDependency) so `prisma migrate deploy` works at startup — a
# prod-only reinstall would drop it and break migrations. Also brings the
# generated client + query engine.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

# Apply pending migrations, then start. The app binds process.env.PORT
# (Railway injects it). migrate deploy is idempotent.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
