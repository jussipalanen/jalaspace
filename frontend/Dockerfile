# Development image for the JalaSpace frontend.
# Node major version matches frontend/.nvmrc.
FROM node:24-alpine

WORKDIR /app

# Run as the image's unprivileged "node" user instead of root.
RUN chown node:node /app
USER node

# Install dependencies first so this layer is cached until the lock file changes.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
