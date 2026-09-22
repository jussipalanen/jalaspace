# Development image for the JalaSpace API.
# Node major version matches backend/.nvmrc; Node runs the TypeScript sources directly.
FROM node:24-alpine

WORKDIR /app

# Run as the image's unprivileged "node" user instead of root.
RUN chown node:node /app
USER node

# Install dependencies first so this layer is cached until the lock file changes.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

ENV HOST=0.0.0.0 PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["npm", "run", "dev"]
