# Use lightweight Alpine Linux with Node.js 22
FROM node:22-alpine

WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY src ./src

# Expose default port
EXPOSE 3099

# Default environment variables
ENV NODE_ENV=production \
    PORT=3099

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3099) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the server
CMD ["node", "src/server.js"]
