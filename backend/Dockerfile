# Multi-stage Dockerfile for LinkedIn Headshot Generator Backend
# Optimized for production with advanced security and AI/ML capabilities

# Build stage
FROM node:18-alpine@sha256:435dcad253bb5b7f347ebc69c8cc52de7c912eb7241098b920f2fc2d7843183d AS builder

LABEL maintainer="DevOps Team <devops@company.com>"
LABEL description="LinkedIn Headshot Generator Backend API - AI-powered professional headshot creation"
LABEL version="2.0.0"

# Set security-related environment variables
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# Set working directory
WORKDIR /app

# Install security updates and build dependencies including AI/ML and image processing tools
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    git \
    curl \
    ca-certificates \
    libc6-compat \
    libvips-dev \
    imagemagick \
    imagemagick-dev \
    ffmpeg \
    && update-ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user early for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files first for better layer caching
COPY --chown=nodejs:nodejs package*.json ./

# Install all dependencies with security audit
RUN npm ci --include=dev --audit --fund false && \
    npm audit --audit-level=high && \
    npm cache clean --force

# Copy source code with proper ownership
COPY --chown=nodejs:nodejs . .

# Run security scans and linting
RUN npm run lint || true

# Remove devDependencies and clean up for production
RUN npm prune --omit=dev && \
    npm cache clean --force

# Production stage - optimized for AI workloads
FROM node:18-alpine@sha256:435dcad253bb5b7f347ebc69c8cc52de7c912eb7241098b920f2fc2d7843183d AS production

# Install runtime dependencies with AI/ML and image processing support
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tini \
    tzdata \
    libvips \
    imagemagick \
    ffmpeg \
    python3 \
    && rm -rf /var/cache/apk/* \
    && update-ca-certificates

# Set comprehensive security and performance environment variables
ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NODE_OPTIONS="--max-old-space-size=2048 --enable-source-maps" \
    PORT=3001 \
    TZ=UTC \
    VIPS_CONCURRENCY=4 \
    VIPS_DISC_THRESHOLD="100mb"

# Create app directory
WORKDIR /app

# Create non-root user with locked account
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs \
    -h /app -s /bin/false

# Copy built application from builder stage with minimal files
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nodejs:nodejs /app/knexfile.js ./

# Create necessary directories with strict permissions for AI workloads
RUN mkdir -p /app/logs /app/uploads /app/temp /app/models /app/cache && \
    chown -R nodejs:nodejs /app && \
    chmod -R 750 /app && \
    chmod 700 /app/logs /app/uploads /app/temp /app/models /app/cache

# Advanced health check with AI service validation
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3001}/health && \
        curl -f http://localhost:${PORT:-3001}/api/v1/health/ai || exit 1

# Switch to non-root user for security
USER nodejs

# Expose port (documentation only in production)
EXPOSE 3001

# Set resource limits optimized for AI workloads
LABEL org.opencontainers.image.constraints="memory=2Gi,cpu=1000m"

# Add build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF
ARG BUILD_VERSION

# Add comprehensive labels for container metadata
LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.url="https://github.com/company/linkedin-headshot-generator"
LABEL org.opencontainers.image.source="https://github.com/company/linkedin-headshot-generator"
LABEL org.opencontainers.image.version=$BUILD_VERSION
LABEL org.opencontainers.image.revision=$VCS_REF
LABEL org.opencontainers.image.vendor="Company Name"
LABEL org.opencontainers.image.title="LinkedIn Headshot Generator Backend"
LABEL org.opencontainers.image.description="AI-powered professional headshot generation service with advanced image processing"

# Use tini as init system for proper signal handling and zombie reaping
ENTRYPOINT ["tini", "--"]

# Start the application with production optimizations
CMD ["node", "--unhandled-rejections=strict", "--trace-warnings", "src/app.js"]

# Add graceful shutdown handling
STOPSIGNAL SIGTERM