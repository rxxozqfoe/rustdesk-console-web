# syntax=docker/dockerfile:1
#
# Multi-stage build for the RustDesk web console (React 19 + Vite 8 SPA).
#
#   build   -- Node + pnpm; installs the locked dependency set and runs the
#              project's own `pnpm build` (tsc -b && vite build) to produce
#              the static bundle in /app/dist.
#   runtime -- Chainguard nginx (cosign keyless-signed, nonroot, listens on
#              8080) serving the static bundle with an SPA fallback so
#              client-side routes resolve to index.html.
#
# Every FROM is pinned to a digest (enforced by CI). When bumping a digest,
# update .github/cosign-image-policy.json if the base image changes.

# ---- build stage ----------------------------------------------------------
# node:22-bookworm-slim — Node 22 LTS. pnpm-lock.yaml is lockfileVersion 6.0
# (pnpm 8.x), pinned below via corepack.
FROM --platform=$BUILDPLATFORM docker.io/library/node:22-bookworm-slim@sha256:7af03b14a13c8cdd38e45058fd957bf00a72bbe17feac43b1c15a689c029c732 AS build

WORKDIR /app

# Enable the pnpm shim that ships with Node via corepack, pinned to the major
# that produced the lockfile. Done before copying sources so this layer caches
# independently of application code.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@8 --activate

# Install dependencies first, against only the manifest + lockfile, so the
# (expensive) install layer is reused whenever only source files change.
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Build the static site. `pnpm build` is `tsc -b && vite build`; output → dist/.
COPY . .
RUN pnpm build

# ---- runtime stage --------------------------------------------------------
# cgr.dev/chainguard/nginx — minimal, nonroot (uid 65532), cosign-signed.
# Serves /usr/share/nginx/html on :8080 by default.
FROM cgr.dev/chainguard/nginx@sha256:b91cf888522ed0cc1b6bddadfa8320ac2a131a1003b103ae340217a421f12fcc AS runtime

# SPA-aware server config (overwrites the stock default site config).
COPY docker/nginx.conf /etc/nginx/conf.d/nginx.default.conf

# Static bundle.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# Base image already sets a nonroot USER, ENTRYPOINT (/usr/sbin/nginx ...)
# and a sane default CMD; nothing to override.
