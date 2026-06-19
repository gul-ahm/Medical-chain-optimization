# Stage 1: Build
FROM node:20-alpine as builder

WORKDIR /app
COPY apps/web/package*.json ./
RUN npm install

COPY apps/web .
# Disable telemetry for build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Public is optional
# COPY --from=builder /app/public ./public

EXPOSE 3000
# Run the standalone server
CMD ["node", "server.js"]
