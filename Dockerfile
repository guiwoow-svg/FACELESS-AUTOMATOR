# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY server.js ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s CMD wget -qO- http://localhost:3000/ || exit 1
CMD ["node", "server.js"]
