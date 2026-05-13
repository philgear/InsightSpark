# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps (copy lockfile first for layer caching)
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy source and build production bundle
COPY . .
RUN npx ng build --configuration=production

# ── Stage 2: Serve ────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Only copy package.json to install production dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy the server.js file and the built Angular static files
COPY server.js ./
COPY --from=builder /app/dist ./dist

# Ensure the server listens on 8080 (Cloud Run default)
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]