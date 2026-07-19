# CareerBridge backend (Express + Prisma). node:24-alpine runtime so both
# `node` and the Prisma CLI exist for the startup migration.
#
# Node 24 is REQUIRED, not incidental: pdf-parse@1.1.4's bundled pdf.js fails
# with "bad XRef entry" on Node 22 for PDFs it parses fine on Node 24. On
# node:22-alpine every PDF resume upload silently returned status FAILED with
# no extracted text (DOCX was unaffected, which is why it went unnoticed).
# Verified by running the identical file through both images.
# Do not downgrade this tag without re-verifying PDF resume extraction.

# ---- build stage ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runtime stage ----
FROM node:24-alpine AS runtime
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
