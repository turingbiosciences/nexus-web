# nexus-web production image
#
# COPY THIS FILE INTO THE nexus-web REPO (as ./Dockerfile) — it builds that
# repo's tree, not this one. It lives here only so the whole deployment is
# reviewable in one place.
#
# Requires one change to nexus-web/next.config.ts:
#
#     const nextConfig: NextConfig = {
#       output: 'standalone',          <-- add this
#       async headers() { ... }
#     }
#
# Without it, .next/standalone is never emitted and the runtime stage below has
# nothing to copy.
#
# Build:
#   docker build -t nexus-web:local \
#     --build-arg NEXT_PUBLIC_LOGTO_ENDPOINT=https://... \
#     --build-arg NEXT_PUBLIC_LOGTO_APP_ID=... \
#     --secret id=sentry_auth_token,src=./sentry.token .

# ---------- deps ----------
FROM node:22-alpine AS deps
# libc6-compat: sharp / Next's native bits expect glibc symbols on musl.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts blocks dependency lifecycle scripts during install
# (docker:S6505). Safe here: npm already withholds every install script in this
# tree by default -- @sentry/cli, esbuild, sharp, unrs-resolver -- and
# `next build` succeeds without them, because the native binaries those scripts
# would fetch ship as ordinary optional dependencies instead.
RUN npm ci --ignore-scripts

# ---------- builder ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time, so they
# must be present here — setting them at runtime has no effect.
#
# Note what is NOT here: NEXT_PUBLIC_TURING_API. Under the new architecture the
# browser calls same-origin /api/turing/*, which a Next.js route handler proxies
# to http://api:8080 server-side. Baking an API origin into the bundle would
# re-expose the API address and force the CSP connect-src hole back open.
ARG NEXT_PUBLIC_LOGTO_ENDPOINT
ARG NEXT_PUBLIC_LOGTO_APP_ID
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_DATA_MODE=live
ARG NEXT_PUBLIC_TBIO_DEBUG=false
ENV NEXT_PUBLIC_LOGTO_ENDPOINT=$NEXT_PUBLIC_LOGTO_ENDPOINT \
    NEXT_PUBLIC_LOGTO_APP_ID=$NEXT_PUBLIC_LOGTO_APP_ID \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_DATA_MODE=$NEXT_PUBLIC_DATA_MODE \
    NEXT_PUBLIC_TBIO_DEBUG=$NEXT_PUBLIC_TBIO_DEBUG \
    NEXT_TELEMETRY_DISABLED=1

# withSentryConfig uploads source maps during build. The token is passed as a
# BuildKit secret so it never lands in a layer or in the image history.
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" \
    npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat \
    && addgroup -g 1001 nodejs \
    && adduser -S -u 1001 -G nodejs nextjs
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
