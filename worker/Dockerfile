FROM node:20-alpine

WORKDIR /app

# Copy worker package.json
COPY worker/package*.json ./

# Install dependencies
RUN npm ci --production

# Copy worker code
COPY worker/ ./

# Set environment
ENV NODE_ENV=production

# Run worker
CMD ["node", "index.js"]



