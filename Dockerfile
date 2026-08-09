FROM node:24-bookworm-slim AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/monopoly.sqlite
EXPOSE 3000
VOLUME ["/data"]
CMD ["npm", "run", "server"]
