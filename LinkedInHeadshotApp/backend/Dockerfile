# OmniShot Backend Production Dockerfile
# Multi-stage build for optimized production container

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci --only=production=false

# Copy source code
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove devDependencies and clean cache
RUN npm prune --production && npm cache clean --force

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    libjpeg-turbo \
    freetype \
    ttf-dejavu \
    fontconfig \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S omnishot && \
    adduser -S omnishot -u 1001 -G omnishot

# Set working directory
WORKDIR /app

# Change ownership of app directory
RUN chown -R omnishot:omnishot /app
USER omnishot

# Copy production files from builder
COPY --from=builder --chown=omnishot:omnishot /app/node_modules ./node_modules
COPY --from=builder --chown=omnishot:omnishot /app/dist ./dist
COPY --from=builder --chown=omnishot:omnishot /app/prisma ./prisma
COPY --from=builder --chown=omnishot:omnishot /app/package*.json ./

# Create directories for runtime
RUN mkdir -p logs uploads temp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]