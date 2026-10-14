# Images for the JalaSpace API. Node runs the TypeScript sources directly, so there is no build step.
# Node major version matches backend/.nvmrc.
#
#   development  Docker Compose (target: development): all dependencies, restarts on edits
#   production   Cloud Run: runtime dependencies only. The last stage, so a plain
#                `docker build backend` and `gcloud run deploy --source backend` build it.
FROM node:24-alpine AS base

WORKDIR /app

# Run as the image's unprivileged "node" user instead of root.
RUN chown node:node /app
USER node

# Cloud Run sets PORT itself (8080).
ENV HOST=0.0.0.0 PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

FROM base AS development

# Install dependencies first so this layer is cached until the lock file changes.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

CMD ["npm", "run", "dev"]

FROM base AS production

ENV NODE_ENV=production

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

# Node directly instead of npm start, so Cloud Run's SIGTERM reaches the server.
CMD ["node", "src/server.ts"]
