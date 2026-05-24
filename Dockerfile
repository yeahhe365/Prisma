FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV VITE_API_PROXY_MODE=local
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV PRISMA_STATIC_DIR=/app/dist

COPY --from=build /app/dist /app/dist
COPY docker/server.mjs /app/server.mjs

EXPOSE 80

CMD ["node", "server.mjs"]
