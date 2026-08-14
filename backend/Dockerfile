# Node version is pinned to work around the keep-alive "Premature close" bug
# (CVE-2026-48931 fix in 22.23.0 / 24.17.0 / 26.3.1) that breaks node-fetch@2
# used by @google/earthengine. See https://github.com/nodejs/node/issues/63989
# Last known-good versions: 22.22.3 (current), 24.16.0. Once the official fix
# ships (https://github.com/nodejs/node/pull/64004), bump to a patched release.

# ── Stage 1: Dependências de produção ────────────────────────────────────────
FROM node:22.22.3-alpine AS prod-deps
#FROM node:24.16.0-alpine AS prod-deps

RUN apk upgrade --no-cache

WORKDIR /opt/backend

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
RUN pnpm rebuild bcrypt msgpackr-extract

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:22.22.3-alpine AS builder
#FROM node:24.16.0-alpine AS builder

RUN apk upgrade --no-cache

WORKDIR /opt/backend

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild bcrypt msgpackr-extract

COPY . .
RUN pnpm run build

# ── Stage 3: Imagem final ─────────────────────────────────────────────────────
FROM node:22.22.3-alpine
#FROM node:24.16.0-alpine

RUN apk upgrade --no-cache && apk add --no-cache bash

WORKDIR /opt/backend

COPY --from=prod-deps /opt/backend/node_modules ./node_modules
COPY --from=builder /opt/backend/dist ./dist
COPY package.json ./

EXPOSE 80

CMD ["node", "dist/main.js"]
