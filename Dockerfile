FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm i --omit=dev

# Copy source
COPY src ./src
COPY migrations ./migrations

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run migrations then start the server
CMD ["/bin/sh", "-c", "node src/migrate.js && node src/index.js"]
