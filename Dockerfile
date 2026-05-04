# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:22-alpine3.21 AS builder

WORKDIR /app

# Install deps (copy lockfile first for layer caching)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build production bundle
COPY . .
RUN npx ng build --configuration=production

# ── Stage 2: Serve ────────────────────────────────────────────────
FROM nginx:1.28-alpine3.21

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular build output — angular.json outputs to dist/ directly
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing + Cloud Run port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
