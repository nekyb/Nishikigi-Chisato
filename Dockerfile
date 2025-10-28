FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    TZ=Etc/UTC \
    AUTH_DIR=./auth_info \
    LOG_LEVEL=silent

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*


COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/auth_info /app/database

VOLUME ["/app/auth_info", "/app/database"]

CMD ["node", "index.js"]
