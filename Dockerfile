# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps (copy lockfile first for layer caching)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build production bundle
COPY . .
RUN npx ng build --configuration=production

# ── Stage 2: Serve ────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular build output (browser subfolder is the static SPA)
COPY --from=builder /app/dist/browser /usr/share/nginx/html

# Custom nginx config for SPA routing + Cloud Run port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
