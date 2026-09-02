# ==========================================
# Stage 1: Build production web application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies deterministically
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files and configuration
COPY tsconfig.json tsconfig.tsbuildinfo* vite.config.ts index.html ./
COPY public ./public
COPY src ./src

# Build production SPA assets into dist/
RUN npm run build

# ==========================================
# Stage 2: Unprivileged production web server
# ==========================================
FROM nginx:alpine AS runner

# Configure directories and permissions for unprivileged execution
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run /tmp/nginx \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /tmp/nginx /usr/share/nginx/html

# Copy unprivileged Nginx configuration
COPY deployment/nginx-docker.conf /etc/nginx/nginx.conf

# Copy compiled production assets from builder stage
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Run as non-root user
USER nginx

# Expose production port
EXPOSE 8080

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
