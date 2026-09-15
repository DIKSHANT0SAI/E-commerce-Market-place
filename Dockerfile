# syntax=docker/dockerfile:1

# Node 24 (alpine) to match the npm 11 that generated package-lock.json — so `npm ci`
# resolves the lockfile the same way it does locally and in CI.

# ---------- Stage 1: install dependencies ----------
FROM node:24-alpine AS deps
# libc6-compat helps some native dependencies run on Alpine.
RUN apk add --no-cache libc6-compat
WORKDIR /app
# `mongodb-memory-server` (a devDependency, used only by `npm run bench`) downloads a
# ~150MB MongoDB binary in its postinstall hook. We can't skip devDependencies here —
# tailwindcss and postcss live there and the build needs them — so skip just that
# download. The benchmark fetches the binary lazily on first run instead.
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Stage 2: build the app ----------
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time, so they must be
# provided here as build args. Server-only secrets (MONGODB_URI, CLERK_SECRET_KEY, ...)
# are read at RUNTIME instead and are NOT needed during the build.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID
ARG NEXT_PUBLIC_GOOGLE_API_KEY
ARG NEXT_PUBLIC_ADMIN_EMAILS
ARG NEXT_PUBLIC_CURRENCY="₹"
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID \
    NEXT_PUBLIC_GOOGLE_API_KEY=$NEXT_PUBLIC_GOOGLE_API_KEY \
    NEXT_PUBLIC_ADMIN_EMAILS=$NEXT_PUBLIC_ADMIN_EMAILS \
    NEXT_PUBLIC_CURRENCY=$NEXT_PUBLIC_CURRENCY \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- Stage 3: run the app ----------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone output = a minimal self-contained server. Static assets and `public/` are
# copied separately (standalone doesn't include them).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Standalone build emits its own server.js entrypoint.
CMD ["node", "server.js"]
