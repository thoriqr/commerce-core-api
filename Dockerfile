FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production env
ENV NODE_ENV=production

# Cloud Run port
EXPOSE 8080

# Start app
CMD ["npm", "start"]