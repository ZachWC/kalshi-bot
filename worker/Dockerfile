FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY worker/package*.json ./
COPY package*.json ../

# Install dependencies
RUN npm ci --production

# Copy worker code
COPY worker/ ./worker/
COPY lib/ ../lib/

# Set environment
ENV NODE_ENV=production

# Run worker
CMD ["node", "worker/index.js"]



