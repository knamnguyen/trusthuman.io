# Use the official Bun image
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.production.json ./package.json

# Install dependencies
RUN bun install --production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunjs

# Change ownership of the app directory
RUN chown -R bunjs:nodejs /app
USER bunjs

# Expose port
EXPOSE 3001

# Health check disabled for t2.micro to avoid curl dependency
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["bun", "start"] 