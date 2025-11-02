# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    TZ=Etc/UTC \
    AUTH_DIR=./auth_info \
    LOG_LEVEL=silent

WORKDIR /app

# Install minimal deps that are commonly required by headless libs and fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# Install deps first for better caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Ensure expected writable dirs exist
RUN mkdir -p /app/auth_info /app/database

# Persist sessions and database outside the container FS
VOLUME ["/app/auth_info", "/app/database"]

# Default command
CMD ["node", "index.js"]
