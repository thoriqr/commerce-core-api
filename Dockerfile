FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build application
RUN npm run build

# Production environment
ENV NODE_ENV=production

# Cloud Run
EXPOSE 8080

CMD ["node", "dist/src/server.js"]