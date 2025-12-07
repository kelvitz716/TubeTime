# =============================================================================
# TubeTime Backend - Production Dockerfile
# =============================================================================
# Multi-stage build for optimized production image with yt-dlp support
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies + tsx (needed at runtime but listed as devDep)
RUN npm ci --only=production && \
    npm install tsx && \
    # Clean npm cache
    npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# -----------------------------------------------------------------------------
# Stage 3: Production Runtime
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

# Install tini for proper signal handling and yt-dlp dependencies
RUN apk add --no-cache \
    tini \
    python3 \
    py3-pip \
    ffmpeg \
    && python3 -m venv /venv \
    && /venv/bin/pip install --no-cache-dir yt-dlp \
    && ln -s /venv/bin/yt-dlp /usr/local/bin/yt-dlp \
    # Clean up
    && rm -rf /root/.cache

# Create non-root user for security
RUN addgroup -g 1001 -S tubetime && \
    adduser -S tubetime -u 1001 -G tubetime

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/package.json ./
COPY --from=builder /app/seed.js ./

# Create data directory for SQLite
RUN mkdir -p /data && chown tubetime:tubetime /data

# Switch to non-root user
USER tubetime

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/data/tubetime.db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "--import", "tsx", "src/index.js"]
