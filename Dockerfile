# Build the React/Vite client, then run Express which serves both /api and the built dist/.
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --include=dev
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist
# data/ is mounted from a persistent Fly volume at runtime — create the dir as a fallback
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "server/index.js"]
