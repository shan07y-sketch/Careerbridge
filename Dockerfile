# CareerBridge frontend (Vite SPA) — build, then serve with the zero-dependency
# Node static server. The runtime image is node:22-alpine, so `node` is always
# present on PATH (fixes "executable node could not be found").

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

# VITE_API_URL is baked into the bundle at build time. Railway passes service
# variables to the Docker build; declare it as an ARG so Vite can read it.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# server.js has zero dependencies, so only the built assets + the server are
# needed at runtime — no node_modules to install or prune.
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

# server.js listens on process.env.PORT (Railway injects it).
CMD ["node", "server.js"]
