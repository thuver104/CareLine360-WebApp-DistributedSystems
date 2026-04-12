FROM node:18-alpine

# Set working directory
WORKDIR /app/auth-service

# Copy package files
COPY auth-service/package*.json ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
RUN ln -s /app/auth-service/node_modules /app/node_modules

# Copy service and shared files
COPY auth-service/ ./
COPY shared /app/shared

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
CMD ["node", "server.js"]
