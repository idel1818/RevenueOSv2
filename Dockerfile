## syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 build-essential ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --include=dev

COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server ./server

RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000
CMD ["node", "server/index.js"]
